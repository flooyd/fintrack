# finTrack

A personal finance tracker.
Three surfaces: a marketing landing page, a login/signup flow, and an
authenticated dashboard centered on logging income, logging expenses, and
watching net worth grow.

**Stack:** SvelteKit (Svelte 5 runes) · Drizzle ORM (PostgreSQL) · Better Auth ·
Lucide icons · self-hosted fonts via Fontsource.

## Quick start

```sh
yarn install

# 1. Configure the database + auth secrets (see "Environment" below)
cp .env.example .env        # then edit .env

# 2. Create the tables (Better Auth tables are already generated into
#    src/lib/server/db/auth.schema.ts; this pushes everything to Postgres)
yarn db:push

# 3. Run it
yarn dev
```

Open http://localhost:5173. Create an account on `/login?mode=signup` — a fresh
account is seeded with a year of demo activity so the dashboard looks like the
design on first visit.

## Environment

`.env` (copy from `.env.example`):

| Variable                                    | Required | Notes                                                                                                                                                                                                                |
| ------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                              | ✅       | Postgres connection string. A local PostgreSQL 18 server was detected on `localhost:5432`; the default points there as `…/fintrack` — **create that database and set the right password**, e.g. `createdb fintrack`. |
| `ORIGIN`                                    | ✅       | Base URL, e.g. `http://localhost:5173`. Used by Better Auth for callbacks.                                                                                                                                           |
| `BETTER_AUTH_SECRET`                        | ✅       | A high-entropy secret (32+ chars in production).                                                                                                                                                                     |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | optional | Enables the "Continue with Google" button.                                                                                                                                                                           |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | optional | Enables the "Continue with GitHub" button.                                                                                                                                                                           |

Social buttons render **only** when their credential pair is present — email +
password works on its own with no OAuth setup.

If you change the Better Auth config in `src/lib/server/auth.ts`, regenerate the
auth tables with `yarn auth:schema` and re-run `yarn db:push`.

## What's here

```
src/
├── app.css                         # design system: tokens + all component styles
├── routes/
│   ├── +layout.svelte              # loads fonts + global CSS
│   ├── +page.svelte                # marketing landing (/)
│   ├── login/                      # login + signup (/login, ?mode=signup)
│   └── app/                        # authenticated dashboard (/app)
└── lib/
    ├── finance.ts                  # shared money formatters, category colors, icon map
    ├── components/                 # Logo, NetWorthChart, ActionCard, NetWorthCard,
    │                               #   RecentTransactions, CategoriesCard, LogDrawer,
    │                               #   Toast, nav variants, TransactionIcon
    └── server/
        ├── auth.ts                 # Better Auth (email/password + env-gated social)
        ├── dashboard.ts            # builds dashboard data from the ledger + demo seed
        └── db/                     # Drizzle client + schema (transaction + auth tables)
```

### Dashboard behaviour

- **Net worth** = a manual baseline + the signed sum of the ledger (income +,
  expense −). The chart plots month-end running balance; the `1M / 6M / 1Y / ALL`
  toggle reslices it. The **Edit** button sets net worth directly (adjusts the baseline).
- **Add income / expense** open a modal drawer — or press **`I`** / **`E`** anywhere
  on the dashboard. `Esc` or a click outside closes it. Logging fires a toast and
  refreshes the data.
- **Recent activity** and **Spending this month** are derived live from transactions;
  category colors and per-row icons come from the entry's tag.
- Money is stored as integer cents (`amount_cents`) to avoid floating-point drift.

## Verified

- `yarn run check` (svelte-check) — 0 errors, 0 warnings
- `yarn run lint` (prettier + eslint) — clean
- `yarn run build` — succeeds
- End-to-end against the live Postgres: sign up → dashboard shows **$0** with empty
  states (no seed) → **Edit** sets net worth directly → logging income/expense layers
  on top of the baseline (e.g. `$1,000 + $100 − $40 = $1,060`), with entries appearing
  in recent activity and the spending breakdown.
- SSR smoke test — marketing + login render; social buttons hide without creds;
  `/app` redirects to `/login` when unauthenticated.

## Scripts

|                                 |                                                         |
| ------------------------------- | ------------------------------------------------------- |
| `yarn dev`                      | dev server                                              |
| `yarn build` / `yarn preview`   | production build / preview                              |
| `yarn run check`                | type-check                                              |
| `yarn run lint` / `yarn format` | lint / format                                           |
| `yarn db:push`                  | push schema to Postgres                                 |
| `yarn db:studio`                | Drizzle Studio                                          |
| `yarn auth:schema`              | regenerate Better Auth tables after auth config changes |
