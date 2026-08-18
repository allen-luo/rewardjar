-- RewardJar schema, RLS, and signup bootstrap

create extension if not exists "pgcrypto";

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Family jar',
  timezone text not null default 'America/Los_Angeles',
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  display_name text not null default 'Parent',
  created_at timestamptz not null default now()
);

create table public.kids (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  color text not null default 'coral',
  avatar_key text not null default '🦊',
  created_at timestamptz not null default now()
);

create table public.chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  kid_id uuid not null references public.kids (id) on delete cascade,
  title text not null,
  icon text not null default '⭐',
  reward_kind text not null check (reward_kind in ('stamp', 'money')),
  stamp_goal integer not null default 7,
  prize_label text,
  money_cents integer not null default 0,
  active boolean not null default true,
  due_date date,
  due_time time,
  repeat_kind text not null default 'none' check (repeat_kind in ('none', 'daily', 'weekly')),
  repeat_weekdays smallint[] not null default '{}',
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  kid_id uuid not null references public.kids (id) on delete cascade,
  chore_id uuid references public.chores (id) on delete set null,
  kind text not null check (kind in ('stamp', 'money')),
  delta integer not null,
  note text,
  occurrence_date date,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.prize_claims (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  kid_id uuid not null references public.kids (id) on delete cascade,
  chore_id uuid not null references public.chores (id) on delete cascade,
  prize_label text,
  claimed_at timestamptz not null default now()
);

create table public.chore_skips (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  chore_id uuid not null references public.chores (id) on delete cascade,
  occurrence_date date not null,
  created_at timestamptz not null default now(),
  unique (chore_id, occurrence_date)
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table public.reminder_sends (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  chore_id uuid not null references public.chores (id) on delete cascade,
  occurrence_date date not null,
  sent_at timestamptz not null default now(),
  snooze_until timestamptz,
  unique (chore_id, occurrence_date)
);

create index kids_family_idx on public.kids (family_id);
create index chores_family_kid_idx on public.chores (family_id, kid_id);
create index ledger_family_kid_idx on public.ledger_entries (family_id, kid_id, created_at desc);
create index ledger_occurrence_idx on public.ledger_entries (chore_id, occurrence_date);
create index skips_occurrence_idx on public.chore_skips (chore_id, occurrence_date);
create index prize_claims_chore_idx on public.prize_claims (chore_id, claimed_at desc);
create index reminder_sends_lookup_idx on public.reminder_sends (chore_id, occurrence_date);

create or replace function public.family_id_for_user()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_family_id uuid;
  family_name text;
begin
  family_name := coalesce(split_part(new.email, '@', 1), 'Family') || '''s jar';
  insert into public.families (name)
  values (family_name)
  returning id into new_family_id;

  insert into public.profiles (id, family_id, display_name)
  values (
    new.id,
    new_family_id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Parent')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_family_id_from_kid()
returns trigger
language plpgsql
as $$
begin
  select family_id into new.family_id from public.kids where id = new.kid_id;
  return new;
end;
$$;

create trigger chores_set_family before insert or update of kid_id on public.chores
  for each row execute procedure public.set_family_id_from_kid();

create trigger ledger_set_family before insert or update of kid_id on public.ledger_entries
  for each row execute procedure public.set_family_id_from_kid();

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.kids enable row level security;
alter table public.chores enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.prize_claims enable row level security;
alter table public.chore_skips enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminder_sends enable row level security;

create policy families_select on public.families
  for select using (id = public.family_id_for_user());
create policy families_update on public.families
  for update using (id = public.family_id_for_user());

create policy profiles_select on public.profiles
  for select using (family_id = public.family_id_for_user());
create policy profiles_update on public.profiles
  for update using (id = auth.uid());

create policy kids_all on public.kids
  for all using (family_id = public.family_id_for_user())
  with check (family_id = public.family_id_for_user());

create policy chores_all on public.chores
  for all using (family_id = public.family_id_for_user())
  with check (family_id = public.family_id_for_user());

create policy ledger_all on public.ledger_entries
  for all using (family_id = public.family_id_for_user())
  with check (family_id = public.family_id_for_user());

create policy prize_claims_all on public.prize_claims
  for all using (family_id = public.family_id_for_user())
  with check (family_id = public.family_id_for_user());

create policy chore_skips_all on public.chore_skips
  for all using (family_id = public.family_id_for_user())
  with check (family_id = public.family_id_for_user());

create policy push_subscriptions_all on public.push_subscriptions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and family_id = public.family_id_for_user());

create policy reminder_sends_all on public.reminder_sends
  for all using (family_id = public.family_id_for_user())
  with check (family_id = public.family_id_for_user());
