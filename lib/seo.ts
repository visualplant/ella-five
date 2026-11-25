import { abs, SITE_URL, WEBSITE_ID, type Category, type Person } from "@/lib/data";
import { pslug, vpath, type Vertical } from "@/lib/verticals";
import { people, profilePath } from "@/lib/people";
import { getWeek, weekLabel, weeks } from "@/lib/weekly";
import { loadPosts } from "@/lib/blog";

/** Trailing-slash form for JSON-LD @id and url lives in data.ts (SITE_URL, WEBSITE_ID). Canonicals stay without a slash. */
export { SITE_URL, WEBSITE_ID };
export const ROOT_OG_IMAGE = { url: "/opengraph-image" };

export const HOME_TITLE = "Ella – AI Talent Tracker: AI people to follow";
export const HOME_DESCRIPTION = "A short, sourced, regularly updated list of exceptional people in AI across Technical, Design, Research, Product and Growth.";

/** Person pages that must stay unchanged (title, schema, visible copy). */
export const SEO_FROZEN_SLUGS = new Set(["jsn"]);
export const isSeoFrozen = (slug: string) => SEO_FROZEN_SLUGS.has(slug);

/** Search-facing plural, so titles are not hard-coded per page. */
export const FOLLOW_NOUN: Record<string, string> = {
  technical: "engineers",
  design: "designers",
  research: "researchers",
  product: "product leaders",
  growth: "growth marketers",
};

export function followNoun(c: Pick<Category, "slug" | "name"> & { followNoun?: string }): string {
  return c.followNoun || FOLLOW_NOUN[c.slug] || `${c.name.toLowerCase()} people`;
}

export function categoryTitle(c: Pick<Category, "slug" | "name">): string {
  return `5 AI ${followNoun(c)} to follow now – Ella`;
}

export function categoryH1(c: Pick<Category, "slug" | "name">): string {
  return `5 AI ${followNoun(c)} to follow`;
}

/** Draft intros for category pages. Visible copy pending Jason's approval. */
export const CATEGORY_INTROS: Record<string, string> = {
  technical: "Five AI engineers to follow, chosen for how they shape frontier systems and get them shipped. Ella keeps this list short, and every status is drawn from public sources.",
  design: "Five AI designers to follow, chosen for how they define the way people experience AI products. Ella keeps this list short, and every status is drawn from public sources.",
  research: "Five AI researchers to follow, chosen for how they advance what models can learn, reason about and do. Ella keeps this list short, and every status is drawn from public sources.",
  product: "Five AI product leaders to follow, chosen for how they turn research into things people use every day. Ella keeps this list short, and every status is drawn from public sources.",
  growth: "Five AI growth marketers to follow, chosen for how they brought AI to its first billion users. Ella keeps this list short, and every status is drawn from public sources.",
};

export function categoryIntro(c: Pick<Category, "slug"> & { intro?: string }): string | undefined {
  return c.intro || CATEGORY_INTROS[c.slug];
}

const TITLE_MAX = 65;

export function personTitle(p: Pick<Person, "name" | "role" | "org">): string {
  const end = " | Ella";
  const full = `${p.name} – ${p.role}, ${p.org}${end}`;
  if (full.length <= TITLE_MAX) return full;
  const around = `${p.name} – , ${p.org}${end}`;
  const budget = TITLE_MAX - around.length;
  if (budget >= 8) {
    let role = p.role;
    if (role.length > budget) {
      const slice = role.slice(0, Math.max(0, budget - 1));
      const brk = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf(";"), slice.lastIndexOf(","), slice.lastIndexOf("–"), slice.lastIndexOf("-"));
      role = (brk >= 4 ? slice.slice(0, brk) : slice).trimEnd() + "…";
    }
    const t = `${p.name} – ${role}, ${p.org}${end}`;
    if (t.length <= TITLE_MAX) return t;
  }
  const fallback = `${p.name} – ${p.org}${end}`;
  if (fallback.length <= TITLE_MAX) return fallback;
  const nameOnly = `${p.name}${end}`;
  return nameOnly.length <= TITLE_MAX ? nameOnly : p.name;
}

export function personPath(p: Pick<Person, "name">, fallbackCat?: string): string {
  return profilePath(p.name) ?? (fallbackCat ? `/${fallbackCat}/${pslug(p.name)}` : `/${pslug(p.name)}`);
}

export function personId(path: string): string {
  return abs(path) + "#person";
}

export function isIdentityUrl(u: string): boolean {
  try {
    const { hostname, pathname } = new URL(u);
    const h = hostname.replace(/^www\./, "").toLowerCase();
    if (/%ef%bb%bf/i.test(u) || u.includes("\ufeff")) return false;
    if (/\/status(?:es)?\//i.test(pathname)) return false;
    if (h === "youtu.be" || h.endsWith("youtube.com") || h.endsWith("youtube-nocookie.com")) return false;
    if (h.endsWith("vimeo.com")) return false;
    if (h.endsWith("linkedin.com") && /\/(posts?|pulse|feed|activity)\//i.test(pathname)) return false;
    if (/(^|\.)substack\.com$/.test(h) && /\/p\//.test(pathname)) return false;
    return true;
  } catch {
    return false;
  }
}

export function personSameAs(p: Person): string[] {
  const out: string[] = [];
  if (p.url && isIdentityUrl(p.url)) out.push(p.url);
  for (const x of p.profiles || []) {
    if (x.url && isIdentityUrl(x.url)) out.push(x.url);
  }
  return [...new Set(out)];
}

export function personSubjectOf(p: Person): { "@type": "CreativeWork"; url: string }[] {
  const identity = new Set(personSameAs(p));
  return [...new Set((p.sources || []).filter((s) => s && !identity.has(s)))].map((url) => ({ "@type": "CreativeWork" as const, url }));
}

export function firstAppearance(p: Person, appeared: string[]): string | undefined {
  return p.added || (appeared.length ? appeared[appeared.length - 1] : undefined);
}

export function breadcrumbLd(items: { name: string; url?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: it.url } : {}),
    })),
  };
}

export function archiveIndexTitle(): string {
  return "Archive of AI talent lists – Ella";
}

export const ARCHIVE_INDEX_DESCRIPTION = "Earlier editions of Ella’s AI talent lists, as they stood when published.";
export const ARCHIVE_INDEX_H1 = "Archive";

export function archiveWeekTitle(week: string): string {
  return `Ella’s lists as published ${weekLabel(week)}`;
}

export function archiveWeekDescription(v: Vertical, week: string): string {
  const date = weekLabel(week);
  const parts = v.categories.map((c) => `${c.name}: ${c.people[0]?.name ?? ""}`.trim());
  const desc = `Published ${date}. ${parts.join("; ")}.`;
  if (desc.length <= 155) return desc;
  const short = `Published ${date}. ${v.categories.map((c) => `${c.name}: ${(c.people[0]?.name ?? "").split(" ")[0]}`).join("; ")}.`;
  if (short.length <= 155) return short;
  return desc.slice(0, 154).replace(/\s+\S*$/, "") + "…";
}

export function archiveWeekChanges(week: string, v: Vertical): string | null {
  const all = weeks();
  const i = all.indexOf(week);
  const prior = i >= 0 && i < all.length - 1 ? getWeek(all[i + 1]) : null;
  if (!prior) return null;
  const names = (x: Vertical) => new Set(x.categories.flatMap((c) => c.people.map((p) => p.name)));
  const now = names(v);
  const then = names(prior);
  const joined = [...now].filter((n) => !then.has(n));
  const left = [...then].filter((n) => !now.has(n));
  if (!joined.length && !left.length) return "No changes from the previous list.";
  const size = v.categories.reduce((n, c) => n + c.people.length, 0);
  // A full weekly rotation would list 50 names above the fold; keep that case short.
  if (size && joined.length >= size && left.length >= size) {
    return "These lists were fully refreshed this week.";
  }
  const phrase = (label: string, names: string[]) =>
    names.length <= 8 ? `${label}: ${names.join(", ")}.` : `${label}: ${names.length} people.`;
  const parts: string[] = [];
  if (joined.length) parts.push(phrase("New this week", joined));
  if (left.length) parts.push(phrase("No longer listed", left));
  return parts.join(" ");
}

export function alumniInCategory(slug: string): { name: string; href: string; role: string; org: string }[] {
  const live = new Set(
    [...people().values()].filter((e) => e.current && e.c.slug === slug).map((e) => e.slug),
  );
  return [...people().values()]
    .filter((e) => e.cats.includes(slug) && !live.has(e.slug))
    .sort((a, b) => a.p.name.localeCompare(b.p.name))
    .map((e) => ({ name: e.p.name, href: `/${e.home}/${e.slug}`, role: e.p.role, org: e.p.org }));
}

export function postsMentioningPath(path: string): { slug: string; title: string }[] {
  const needle = `href="${path}"`;
  return loadPosts()
    .filter((p) => !p.draft && !p.example && p.html.includes(needle))
    .map((p) => ({ slug: p.slug, title: p.title }));
}

export function personLastModified(e: { p: Person; current: boolean; appeared: string[]; v: Vertical }): Date {
  const times: number[] = [];
  if (e.p.updated) times.push(new Date(e.p.updated).getTime());
  if (e.appeared[0]) times.push(new Date(e.appeared[0] + "T12:00:00Z").getTime());
  if (e.current || !times.length) times.push(new Date(e.v.updated).getTime());
  return new Date(Math.max(...times));
}

export { weekLabel, vpath };
