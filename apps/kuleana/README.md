# Kuleana

Family responsibility & gig tracker — a warm, mobile-first web app for kids and parents.

## Features

- **Board** — Current week brain/work gigs, weekly totals, and close-out
- **Gig Browser** — Claim brain gigs (multi-kid) and work gigs (one per week)
- **Kuleana** — Standing household values, manifesto-style
- **Past Weeks** — Read-only history of closed weeks
- **Parent Settings** — Manage family members and gig catalog

## Data & sync

Edits save locally on every change. With **Supabase** configured, the same household data syncs across phones, tablets, and browsers (last update wins).

### One-time Supabase setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy **Project URL** and **anon public** key from **Settings → API**.
4. Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

5. Rebuild and deploy. For GitHub Pages, add the same `VITE_*` variables as repository **Secrets** used in your build step, or build locally with `.env.local` before committing `dist/`.

All family devices must use the same `VITE_HOUSEHOLD_ID` (default: `kuleana`).

## Development

```bash
cd apps/kuleana
npm install
npm run dev
```

Open the URL Vite prints (with `base` set, usually `http://localhost:5173/apps/kuleana/dist/`).

## Build

```bash
npm run build
```

Output goes to `dist/` for static hosting.

**Live:** https://cortm.github.io/apps/kuleana/dist/
