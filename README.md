# Goddess Physique · Fitness Tracker

A private, responsive, cross-device fitness tracking app. React + Vite + TypeScript
frontend backed directly by **Supabase** (Auth + Postgres + RLS + Storage) — there is
no custom backend. Data is the cloud source of truth, with an offline queue so entries
made without a connection sync automatically when you reconnect.

## Features

- **Dashboard** — KPI cards and charts (weight trend, waist/hip, calories & protein vs
  target, steps & sleep, energy/face-skin, workout completion, strength progression).
- **Daily Log** — morning weight, macros, steps, water, sleep, energy/face-skin ratings,
  workout-completed flag, notes.
- **Workouts** — template library and per-session exercise/set logging with completion
  tracking.
- **Nutrition** — meal-level entries with automatic macro totals.
- **Weekly Progress** — weekly averages and adherence summaries.
- **Measurements** — weight/waist/hip/chest/thigh/arm plus private progress photos.
- **Roadmap** — 12-week plan seeded per user.
- **Settings** — programme start, targets, units, theme.
- **Import / Export / Backup** — Excel/CSV import wizard, CSV/Excel/JSON export, and
  full JSON backup & restore.

## Tech stack

React 19 · Vite · TypeScript · Tailwind CSS v4 · shadcn-style Radix UI · Recharts ·
React Hook Form + Zod · Dexie (offline) · SheetJS (`xlsx`) · Supabase JS.
Tests with Vitest + Testing Library.

## Getting started

```bash
npm install
cp .env.example .env      # then fill in your Supabase values
npm run dev
```

The app shows a **setup screen** until `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
are present. Only the publishable/anon key is ever used in the frontend — never the
service-role key.

### Environment variables

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase **anon/publishable** key. |

## Supabase setup

Run the SQL migrations in `supabase/migrations/` **in order** from the Supabase SQL
Editor (or `supabase db push`):

1. `0001_init.sql` — tables + `updated_at` triggers.
2. `0002_rls.sql` — enables Row Level Security and owner-only policies on every table.
3. `0003_storage.sql` — private `progress-photos` bucket + per-folder owner policies.
4. `0004_provision.sql` — provisioning helpers that seed settings, 7 workout templates
   (25 exercises) and 12 roadmap weeks for each new user.

This app is designed for a **single, dashboard-created user** (public sign-up is not
exposed). Create your user under **Authentication → Users**, then sign in.

> The `0004` trigger seeds settings, templates and the roadmap for users created
> **after** the migrations are applied. If you created the user beforehand, seed them
> once manually: `select public.seed_user_defaults('<user-uuid>');`

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Type-check (`tsc -b`) and build for production. |
| `npm run preview` | Preview the production build. |
| `npm run lint` | Lint with Oxlint. |
| `npm test` | Run the Vitest suite once. |
| `npm run test:watch` | Run tests in watch mode. |

## Going-live checklist

The app builds and tests pass offline, but it has never been run against a live
backend in this repo. Complete these steps to make it operational:

1. **Create a Supabase project** and run `supabase/migrations/0001` → `0004` in order.
2. **Copy `.env.example` to `.env`** and fill `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
3. **Create the user** under Authentication → Users (no public sign-up), then seed it if
   it predates the migrations: `select public.seed_user_defaults('<user-uuid>');`
4. **Smoke test**: sign in, then add a daily log, meal, workout session and a
   measurement **with a photo**; confirm the rows persist and photos load via signed URL.
5. **(Optional) Regenerate types** so `src/lib/database.types.ts` matches the live schema:
   ```bash
   npx supabase gen types typescript --project-id <ref> --schema public > src/lib/database.types.ts
   ```
6. **Deploy** `dist/` to a static host with SPA fallback (`index.html`).

## Deployment

It is a static SPA — build with `npm run build` and serve `dist/` from any static host
(e.g. Nginx, GitHub Pages, Netlify). Configure the host to fall back to `index.html`
for client-side routes.

## Project layout

```
src/
  components/      UI primitives + shared components (ui/, states, kpi-card, …)
  features/        Feature modules: api.ts, hooks.ts, schema.ts, components
  hooks/           use-query (caching), use-auth, use-online, use-pending-sync
  layouts/         App shell (sidebar / rail / mobile nav) + nav config
  lib/             Supabase client, generated-style DB types, offline queue (Dexie)
  pages/           Route pages
  utils/           calculations, dates, export/import helpers (+ tests)
supabase/migrations/  SQL schema, RLS, storage, provisioning
```

## Data rules

- **Nutrition never double counts.** Meal entries are authoritative for a day when any
  exist; manual daily totals are used only when there are no meals.
- **Missing values are excluded** from averages — never treated as zero.
- **Workout completion** = completed sessions ÷ logged sessions.
- Changing targets preserves historical records; **RLS** restricts every row to its owner.
# fitness-Tracker
