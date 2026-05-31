# Kuleana

Family responsibility & gig tracker — a warm, mobile-first web app for kids and parents.

## Features

- **Board** — Current week overview with Kuleana, active brain/work gigs, weekly totals, and close-out
- **Gig Browser** — Claim brain gigs (multi-kid) and work gigs (one per week)
- **Kuleana** — Standing household values, manifesto-style
- **Past Weeks** — Read-only history of closed weeks
- **Parent Settings** — Manage family member names and gig catalog

Data persists in `localStorage` — no login required for v1.

## Development

```bash
cd apps/kuleana
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/` for static hosting.

**Live:** https://cortm.github.io/apps/kuleana/dist/
