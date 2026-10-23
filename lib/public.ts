// Public data shapes for the JSON API, feed and share images.
// WHITELIST ONLY: every field published here is copied explicitly. Never spread source objects,
// so alternates, claim labels, verifiedHow and other internal fields can't leak.
import { people, type Entry } from "@/lib/people";
import { weeks, getWeek, weekLabel } from "@/lib/weekly";
import { SITE } from "@/lib/data";
import type { Person } from "@/lib/verticals";

const str = (s: unknown) => (typeof s === "string" && s.trim() ? s.trim() : null);
const abs = (u: string) => (u.startsWith("/") ? SITE + u : u);
/** City level only: drop anything that looks like a street/postcode, keep at most "City, Region". */
export function cityLevel(loc?: string | null): string | null {
  const s = str(loc); if (!s) return null;
  const parts = s.split(",").map((x) => x.trim()).filter((x) => x && !/\d/.test(x));
  return parts.length ? parts.slice(0, 2).join(", ") : null;
}
const links = (xs: unknown) => Array.isArray(xs) ? xs.filter((x) => x && str(x.url)).map((x) => ({ label: str(x.label) ?? str(x.name) ?? str(x.title), url: x.url as string })) : [];
function media(m: Person["media"]) {
  if (!m) return null;
  if (m.type === "youtube" && str(m.id)) return { type: "youtube" as const, id: m.id!, url: `https://www.youtube.com/watch?v=${m.id}`, caption: str(m.caption), credit: str(m.credit) };
  if (m.type === "image" && str(m.url)) return { type: "image" as const, url: abs(m.url!), alt: str(m.alt), caption: str(m.caption), credit: str(m.credit), link: str(m.link) };
  return null;
}
export const profileUrl = (e: Entry) => `${SITE}/${e.home}/${e.slug}`;
export function publicPerson(e: Entry) {
  const p = e.p;
  return {
    slug: e.slug, name: p.name, url: str(p.url), profileUrl: profileUrl(e),
    category: e.home, categories: [...e.cats],
    role: str(p.role), org: str(p.org), location: cityLevel(p.location),
    status: str(p.status), short: str(p.short), why: str(p.why), tag: str(p.tag), verified: p.verified === true,
    sources: Array.isArray(p.sources) ? p.sources.filter((s) => typeof s === "string") : [],
    products: links(p.products), profiles: links(p.profiles), notable: links(p.notable),
    workedWith: (p.workedWith ?? []).map((w) => ({ name: w.name, role: str(w.role), org: str(w.org), url: str(w.url), relation: str(w.relation) })),
    media: media(p.media), onCurrentList: e.current,
    appearedIn: e.appeared.map((w) => ({ week: w, url: `${SITE}/archive/${w}` })),
  };
}
export const publicPeople = () => [...people().values()].sort((a, b) => a.slug.localeCompare(b.slug)).map(publicPerson);
export const weekUrl = (w: string) => `${SITE}/archive/${w}`;
export function publicWeek(w: string) {
  const v = getWeek(w); if (!v) return null;
  const idx = people();
  return {
    week: w, title: `Lists from ${weekLabel(w)}`, url: weekUrl(w), updated: str(v.updated),
    categories: v.categories.map((c) => ({ slug: c.slug, name: c.name, blurb: str(c.blurb),
      people: c.people.map((p, i) => { const e = idx.get(pslugOf(p.name)); return { rank: i + 1, slug: e?.slug ?? pslugOf(p.name), name: p.name, role: str(p.role), org: str(p.org), location: cityLevel(p.location), status: str(p.status), short: str(p.short), verified: p.verified === true, profileUrl: e ? profileUrl(e) : null }; }) })),
  };
}
import { pslug as pslugOf } from "@/lib/verticals";
export const publicWeeks = () => weeks().map((w) => { const x = publicWeek(w)!; return { week: w, title: x.title, url: x.url, json: `${SITE}/api/v1/weeks/${w}.json`, categories: x.categories.map((c) => c.name) }; });
export const json = (body: unknown) => new Response(JSON.stringify(body, null, 2), { headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=0, must-revalidate" } });
