# Ella Five

Source: [github.com/visualplant/ella-five](https://github.com/visualplant/ella-five)

Ella – AI Talent Tracker: [ellafive.com](https://ellafive.com).

Five short, sourced lists of notable people in AI (Technical, Design, Research, Product, Growth). Statuses describe public role changes, not availability. Visitors can subscribe to one or more lists by email.

## Stack

- Next.js (App Router), static-first, deployed on Vercel
- Self-hosted fonts via `next/font` (Newsreader + Inter)
- Resend for double opt-in subscriptions: one audience, one topic per list, HMAC-signed confirm and one-click unsubscribe links
- AEO: `llms.txt`, JSON-LD (`ItemList` / `Person`), sitemap, robots, OpenGraph

## Data

Lists live in `data/verticals/ai.json`. The AI vertical is served at the root (`/ai` redirects to `/`). To add a vertical (e.g. biotech), add `data/verticals/biotech.json` with the same shape and register it in `lib/verticals.ts`; `/biotech` and `/biotech/<category>` are generated automatically.

## Editable person pages

`content/people/*.md` override matching people in `data/verticals/ai.json`, field by field (fields left out fall back to the JSON). JSN's page lives in `content/people/jsn.md` and is edited on GitHub. A malformed file fails the build with a message naming the file and the problem.

## Build notes

Before building, pull the human-edited content from GitHub main (like `content/about.md`):

```bash
curl -fsSL https://raw.githubusercontent.com/visualplant/ella-five/main/content/people/jsn.md -o content/people/jsn.md
```

## Run locally

```bash
npm install
cp .env.example .env.local   # optional; without Resend vars the form shows "opening soon"
npm run dev
```

## Environment variables

See `.env.example`. Subscriptions are disabled unless `RESEND_API_KEY`, `EMAIL_FROM` and `RESEND_AUDIENCE_ID` are set.

## Credits

MIT licensed.

## Credits

Category icons: [Lucide](https://lucide.dev) (terminal, pen-tool, flask-conical, package, rocket), ISC License, © Lucide Icons and Contributors.

## Weekly archive

Ella saves approved list snapshots to `/workspace/ella/weekly/YYYY-MM-DD.json` (same shape as `data/verticals/ai.json`). New lists publish only after explicit approval; there is no fixed cadence.
Before a deploy, run `scripts/sync-weekly.sh` to validate and copy them into `data/weekly/`, then commit.
Builds read `data/weekly/` to generate `/archive` and `/archive/YYYY-MM-DD`; the footer "Archive" link appears only when at least one week exists.
