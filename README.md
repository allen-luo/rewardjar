# RewardJar

A playful PWA for tracking kids’ chores, stamp cards, and money rewards — with due dates and check-in reminders.

## Setup

1. Copy env vars:

```bash
cp .env.example .env
```

2. Create a free [Supabase](https://supabase.com) project.
3. In the SQL editor, run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql).
4. Put the project URL and anon key in `.env`.
5. Generate Web Push keys:

```bash
npx web-push generate-vapid-keys
```

Add the **public** key as `VITE_VAPID_PUBLIC_KEY` in `.env`.

6. Install and run:

```bash
npm install
npm run dev
```

## Push reminders

Deploy the Edge Function:

```bash
npx supabase functions deploy send-reminders
```

Set function secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (e.g. `mailto:you@example.com`), and `CRON_SECRET`.

Schedule it every 5 minutes (Dashboard → Edge Functions → Schedules, or `pg_cron` + `pg_net` posting to `/functions/v1/send-reminders` with `Authorization: Bearer CRON_SECRET`).

On iPhone, add RewardJar to the Home Screen before enabling notifications.

## Scripts

- `npm run dev` — local Vite app
- `npm run build` — production PWA build
- `npm run preview` — preview the build
