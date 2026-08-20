# RewardJar

A playful PWA for tracking kids’ chores, stamp cards, and money rewards — with due dates and check-in reminders.

## Features

- **Multiple kids** — each with their own color, avatar, chores, stamp cards, and money jar
- **Stamp cards** — fill a card to earn a prize; parent marks when the prize is given to start the next card
- **Money rewards** — pay a configured amount per chore completion; the money jar fills with mixed coins you can tap, drag, or shake
- **Due dates & reminders** — one-time or repeating chores with optional check-in push notifications
- **History** — per-kid timeline of:
  - rewards added or removed (stamps and money)
  - **chores finished** (scheduled occurrences marked complete)
  - **stamp cards completed** (prize given)
  - skipped days
- **Stay signed in** — default on; home-screen installs (iPhone and Android) keep the session in IndexedDB and refresh it when you reopen the icon

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

On iPhone and Android, add RewardJar to the Home Screen, then **sign in inside the installed app**. Stay signed in is on by default (IndexedDB + refresh when you reopen the icon). Browser tabs and the home-screen icon may not share a session. Chrome on Android can still clear site data if you wipe Chrome storage.

## Host on Cloudflare

RewardJar is a static Vite PWA. Deploy it as a **Worker with static assets** (Cloudflare’s current default) on your existing account. Data stays in Supabase.

### CLI (this repo)

```bash
npm run build
npx wrangler deploy
```

That publishes `dist/` to `https://rewardjar.<your-subdomain>.workers.dev`. SPA routes (`/kids/...`, `/settings`) fall back to `index.html`.

Env vars `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_VAPID_PUBLIC_KEY` are baked in at **build** time from `.env`. Rebuild and redeploy after changing them.

After the first deploy, in [Supabase Auth URL config](https://supabase.com/dashboard/project/nndsmcfracnacxzuakfw/auth/url-configuration) set **Site URL** and **Redirect URLs** to the `workers.dev` origin (and any custom domain).

Optional: attach a domain you already manage in Cloudflare (Workers → rewardjar → Settings → Domains & Routes).

### Git-connected Pages (alternative)

This account already has a Pages project (`graydonhousecafe`). Creating a second Pages project via CLI failed here; the Worker deploy above is the supported path. If you later create a Pages project in the dashboard:

1. **Workers & Pages → Create → Pages → Connect to Git**
2. Select `allen-luo/rewardjar`, branch `cursor/rewardjar-pwa`
3. Build command `npm run build`, output `dist`
4. Add the same `VITE_*` variables as production env vars

5. Add `public/_redirects` with `/* /index.html 200` so SPA routes work on Pages

Push reminders still deploy to **Supabase** Edge Functions, not Cloudflare.

## Scripts

- `npm run dev` — local Vite app
- `npm run build` — production PWA build
- `npm run preview` — preview the build
- `npx wrangler deploy` — upload `dist/` to Cloudflare Workers
