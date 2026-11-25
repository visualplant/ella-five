// Public data shapes for the JSON API, feed and share images.
// WHITELIST ONLY: every field published here is copied explicitly. Never spread source objects,
// so alternates, claim labels, verifiedHow and other internal fields can't leak.
import { people, type Entry } from "@/lib/people";
import { weeks, getWeek, weekLabel } from "@/lib/weekly";
import { SITE } from "@/lib/data";
import { defaultVertical, pslug as pslugOf, type Person } from "@/lib/verticals";
import { loadRising } from "@/lib/rising";
import { searchPeople, type SearchHit } from "@/lib/search";
import { isSearchReady, searchFilter } from "@/lib/search-query";
import { initVisibility, publicVisibility, VISIBILITY_LABELS, UNCONFIRMED_LABEL } from "@/lib/visibility";

initVisibility(() => new Set(people().keys()));

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
    visibility: publicVisibility(e.slug),
  };
}
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

function publicListPerson(p: Person, rank: number, e: Entry | undefined) {
  return {
    rank,
    slug: e?.slug ?? pslugOf(p.name),
    name: p.name,
    role: str(p.role),
    org: str(p.org),
    location: cityLevel(p.location),
    status: str(p.status),
    short: str(p.short),
    verified: p.verified === true,
    profileUrl: e ? profileUrl(e) : null,
  };
}

/** Current 5x5. Allowlisted fields only — never copies approvedBy or other raw keys. */
export function publicCurrentList() {
  const v = defaultVertical;
  const idx = people();
  return {
    id: "current",
    slug: v.slug,
    name: v.name,
    title: v.title,
    updated: str(v.updated),
    url: SITE + "/",
    categories: v.categories.map((c) => ({
      slug: c.slug,
      name: c.name,
      blurb: str(c.blurb),
      people: c.people.map((p, i) => publicListPerson(p, i + 1, idx.get(pslugOf(p.name)))),
    })),
  };
}

export function publicRisingStars() {
  const r = loadRising();
  return {
    updated: str(r.updated),
    blurb: str(r.blurb),
    people: r.people.map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      url: str(p.url),
      role: str(p.role),
      org: str(p.org),
      status: str(p.status),
      short: str(p.short),
      signal: str(p.signal),
      tag: str(p.tag),
      sources: Array.isArray(p.sources) ? p.sources.filter((s) => typeof s === "string") : [],
      added: str(p.added),
      upvotes: typeof p.upvotes === "number" ? p.upvotes : 0,
    })),
  };
}

export function publicSearch(query: string): { error: string } | { query: string; results: { id: string; name: string; href: string; secondary: string }[] } {
  if (!isSearchReady(query)) return { error: "Query must be at least 3 characters" };
  const results = searchPeople()
    .filter((h: SearchHit) => searchFilter({ value: h.id, label: h.name, keywords: h.keywords }, query))
    .map((h) => ({ id: h.id, name: h.name, href: h.href, secondary: h.secondary }));
  return { query: query.trim(), results };
}



/** Every person on every 5x5 (current + all weekly archives), full public profile plus where they placed. */
export function publicAllPeople() {
  const idx = people();
  const placements = new Map<string, { list: string; category: string; rank: number }[]>();
  const add = (list: string, v: { categories: { slug: string; people: Person[] }[] }) => {
    for (const c of v.categories) c.people.forEach((p, i) => {
      const s = pslugOf(p.name);
      const arr = placements.get(s) ?? [];
      arr.push({ list, category: c.slug, rank: i + 1 });
      placements.set(s, arr);
    });
  };
  add("current", defaultVertical);
  for (const w of weeks()) { const v = getWeek(w); if (v) add(w, v); }
  const list = [...idx.values()]
    .sort((a, b) => Number(b.current) - Number(a.current) || a.p.name.localeCompare(b.p.name))
    .map((e) => ({ ...publicPerson(e), placements: placements.get(e.slug) ?? [] }));
  return {
    updated: str(defaultVertical.updated),
    lists: ["current", ...weeks()],
    count: list.length,
    people: list,
  };
}

/** Compact person for list-style API calls: identity, role, placements and current visibility (no history). */
function compactPerson(full: ReturnType<typeof publicPerson> & { placements: { list: string; category: string; rank: number }[] }) {
  const v = full.visibility;
  return {
    slug: full.slug, name: full.name, profileUrl: full.profileUrl,
    category: full.category, categories: full.categories,
    role: full.role, org: full.org, location: full.location, status: full.status, short: full.short, tag: full.tag,
    onCurrentList: full.onCurrentList,
    appearedIn: full.appearedIn.map((a) => a.week),
    placements: full.placements,
    visibility: v ? { level: v.level, label: v.label, checked: v.checked, spotted: v.spotted, rise: v.rise } : null,
  };
}

const normLabel = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, " ");

export type PeopleQuery = { fields?: string | null; visibility?: string | null; category?: string | null; current?: string | null };

/**
 * GET /api/v1/people. Compact by default (fits an LLM tool call); `fields=full` returns full profiles.
 * Filters: `visibility` (label such as "prominent" or "under-the-radar", or level 1-5), `category`, `current=true`.
 * `visibilityCounts` always covers the whole filtered-by-category/current set, before the visibility filter.
 */
export function publicPeople(q: PeopleQuery = {}): { error: string } | Record<string, unknown> {
  const all = publicAllPeople();
  const full = (q.fields ?? "").trim().toLowerCase() === "full";
  let rows = all.people;
  const cat = (q.category ?? "").trim().toLowerCase();
  if (cat) rows = rows.filter((p) => p.categories.includes(cat) || p.category === cat);
  const cur = (q.current ?? "").trim().toLowerCase();
  if (cur === "true" || cur === "1") rows = rows.filter((p) => p.onCurrentList);
  else if (cur === "false" || cur === "0") rows = rows.filter((p) => !p.onCurrentList);

  const visibilityCounts: Record<string, number> = {};
  for (const p of rows) { const l = p.visibility?.label ?? "None"; visibilityCounts[l] = (visibilityCounts[l] ?? 0) + 1; }

  const vis = (q.visibility ?? "").trim();
  if (vis) {
    const known = [...Object.values(VISIBILITY_LABELS), UNCONFIRMED_LABEL];
    const level = /^[1-5]$/.test(vis) ? Number(vis) : null;
    const want = normLabel(vis);
    if (level == null && !known.some((l) => normLabel(l) === want)) {
      return { error: `Unknown visibility "${vis}". Use a label (${known.map((l) => l.toLowerCase().replace(/ /g, "-")).join(", ")}) or a level 1-5.` };
    }
    rows = rows.filter((p) => p.visibility && (level != null ? p.visibility.level === level : normLabel(p.visibility.label) === want));
  }

  return {
    updated: all.updated,
    lists: all.lists,
    total: all.count,
    count: rows.length,
    fields: full ? "full" : "summary",
    filters: { visibility: vis || null, category: cat || null, current: cur || null },
    visibilityCounts,
    detail: "Full profile and visibility history: /api/v1/people/{slug}. Full profiles for everyone: /api/v1/people?fields=full.",
    people: full ? rows : rows.map(compactPerson),
  };
}

/** Every published list (current + archived), one entry per publish date, newest first. */
export function publicListIndex() {
  const cur = defaultVertical;
  const curDate = (str((cur as { compiled?: string }).compiled) ?? str(cur.updated) ?? "").slice(0, 10);
  const dates = new Set(weeks());
  if (/^\d{4}-\d{2}-\d{2}$/.test(curDate)) dates.add(curDate);
  const lists = [...dates].sort().reverse().map((d) => {
    const isCurrent = d === curDate;
    const v = isCurrent ? cur : getWeek(d);
    return {
      date: d,
      name: weekLabel(d),
      status: isCurrent ? "current" : "archived",
      categories: (v?.categories ?? []).map((c) => c.name),
      url: isCurrent ? SITE + "/" : weekUrl(d),
      json: isCurrent ? `${SITE}/api/v1/lists/current` : `${SITE}/api/v1/lists/${d}`,
    };
  });
  return { count: lists.length, lists };
}
