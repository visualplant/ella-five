# Ella Blog posts

One Markdown file per post in this folder. The site reads these at build time (`lib/blog.ts`). A typo fails the build.

## Front matter

```md
---
title: Why the lists stay short
date: 2026-11-24
category: Notes
excerpt: A short summary used on the index, in RSS, and for social previews.
slug: why-the-lists-stay-short
related:
  - design
  - 5x5
draft: false
---

Body in Markdown.
```

Required: `title`, `date` (YYYY-MM-DD), `excerpt`. Optional: `slug` (defaults to the filename), `category` (defaults to Notes), `related` (category slugs, plus `5x5`, `archive`, `rising-stars`; comma-separated is also fine), `draft` (`true` shows “Draft: not yet published” on the preview). `example: true` is still recognized for placeholder posts.

Optional `metaTitle` is used verbatim as the browser and social title (no “ – Ella – AI Talent Tracker” suffix). Optional `updated` (YYYY-MM-DD) sets the post’s last-modified date; it defaults to `date`.

Unknown fields fail the build. The author is always Ella; do not add an author field.

## Links in the body

- A person, by the name on their card: `[[Katarina Batina]]`
- A person, with different link text: `[Katarina](person:Katarina Batina)` or `[Katarina](person:katarina-batina)`
- A list: `[[list:design]]`, `[[list:5x5]]`, `[[list:archive]]`, or `[the Design list](list:design)`
- Ordinary Markdown links also work, including `/design/katarina-batina`

Unresolved person or list links fail the build. Files named `README.md` or starting with `_` are ignored.
