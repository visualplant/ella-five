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
