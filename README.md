# RewardJar

A playful PWA for tracking kids’ chores, stamp cards, and money rewards — with due dates and check-in reminders.

## Features

- **Multiple kids** — each with their own color, avatar, chores, stamp cards, and money jar
- **Stamp cards** — fill a card to earn a prize; parent marks when the prize is given to start the next card
- **Money rewards** — pay a configured amount per chore completion
- **Due dates & reminders** — one-time or repeating chores with optional check-in push notifications
- **History** — per-kid timeline of:
  - rewards added or removed (stamps and money)
  - **chores finished** (scheduled occurrences marked complete)
  - **stamp cards completed** (prize given)
  - skipped days

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

## Host on Cloudflare Pages

RewardJar is a static Vite PWA. Use **Workers & Pages** on your existing Cloudflare account (not a Worker that runs React). Data stays in Supabase.

1. In Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
2. Select `allen-luo/rewardjar`. Use branch `cursor/rewardjar-pwa` (or `main` after you merge).
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Add production environment variables (Settings → Environment variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_VAPID_PUBLIC_KEY`
5. Deploy. You’ll get a URL like `https://rewardjar.pages.dev`.
6. In [Supabase Auth URL config](https://supabase.com/dashboard/project/nndsmcfracnacxzuakfw/auth/url-configuration), set **Site URL** and **Redirect URLs** to that origin (and any custom domain).

SPA routes (`/kids/...`, `/settings`) are covered by [`public/_redirects`](public/_redirects). Optional: attach a domain you already manage in Cloudflare (Pages → Custom domains).

To publish a local build instead of Git:

```bash
npm run build
npx wrangler pages deploy dist --project-name rewardjar
```

Push reminders still deploy to **Supabase** Edge Functions, not Cloudflare.

## Scripts

- `npm run dev` — local Vite app
- `npm run build` — production PWA build
- `npm run preview` — preview the build
- `npx wrangler pages deploy dist --project-name rewardjar` — upload `dist/` to Cloudflare Pages
