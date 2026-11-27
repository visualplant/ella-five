// Server-only: every list appearance, derived at build time from data/weekly.
// Uses weeks() from lib/weekly.ts, the same source the archive and profile pages use for published weeks,
// so a week gets badges exactly when its archive page exists. No per-person code.
import { weeks, getWeek } from "@/lib/weekly";
import { pslug } from "@/lib/verticals";
import type { BadgeAppearance } from "@/lib/badge";

type Hit = BadgeAppearance & { slug: string };
let cache: Hit[] | null = null;

/** Every appearance (newest week first), one per week x category x rank 1-5. */
export function allAppearances(): Hit[] {
  if (cache) return cache;
  cache = weeks().flatMap((week) => {
    const v = getWeek(week); if (!v) return [];
    return v.categories.flatMap((c) => c.people.slice(0, 5).map((p, i) => ({ week, category: c.slug, name: c.name, rank: i + 1, slug: pslug(p.name) })));
  });
  return cache;
}

/** A person's appearances by profile slug, newest week first. Empty when they have never been on a published list. */
export const appearancesFor = (slug: string): BadgeAppearance[] =>
  allAppearances().filter((a) => a.slug === slug).sort((x, y) => y.week.localeCompare(x.week) || x.category.localeCompare(y.category)).map(({ slug: _s, ...a }) => a);
