// Merged people index: ai.json (current, newest) + every archived list in data/weekly/.
// One permanent profile per person at /<category>/<slug>; the category is where they first appeared.
import { defaultVertical, pslug, type Vertical } from "@/lib/verticals";
import type { Category, Person } from "@/lib/data";
import { weeks, getWeek } from "@/lib/weekly";

export type Entry = { slug: string; home: string; v: Vertical; c: Category; p: Person; current: boolean; appeared: string[]; cats: string[] };
let cache: Map<string, Entry> | null = null;
export function people(): Map<string, Entry> {
  if (cache) return cache;
  const m = new Map<string, Entry>();
  // Oldest first, current last, so later sources overwrite data and nav context while home stays the first category.
  const src: [string | null, Vertical][] = [...weeks().slice().reverse().map((w) => [w, getWeek(w)] as [string, Vertical | null]).filter((x): x is [string, Vertical] => !!x[1]), [null, defaultVertical]];
  for (const [w, v] of src) for (const c of v.categories) for (const p of c.people) {
    const slug = pslug(p.name); const e = m.get(slug);
    const n: Entry = e ?? { slug, home: c.slug, v, c, p, current: false, appeared: [], cats: [] };
    if (!e || !n.current) { n.v = v; n.c = c; n.p = p; }
    if (w) n.appeared.unshift(w); else n.current = true;
    if (!n.cats.includes(c.slug)) n.cats.push(c.slug);
    m.set(slug, n);
  }
  return (cache = m);
}
export const profilePath = (name: string) => { const e = people().get(pslug(name)); return e ? `/${e.home}/${e.slug}` : null; };
