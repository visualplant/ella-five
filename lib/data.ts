import { defaultVertical, vpath, type Vertical, type Category } from "@/lib/verticals";
export type { Person, Category, Vertical } from "@/lib/verticals";
export const data = defaultVertical;
export const categories = defaultVertical.categories;
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://ellafive.com").replace(/\/$/, "");
export const REPO = "https://github.com/visualplant/ella-five";
export const getCategory = (slug: string, v: Vertical = defaultVertical) => v.categories.find((c) => c.slug === slug);
export function formatUpdated(iso = data.updated) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) + " PT";
}
export const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");
export const abs = (path: string) => SITE + (path === "/" ? "" : path);
export function itemListLd(c: Category, v: Vertical = defaultVertical) {
  return { "@context": "https://schema.org", "@type": "ItemList", name: `Ella: top ${c.name} talent in ${v.name}`, description: c.blurb, dateModified: v.updated, url: abs(vpath(v, c.slug)), numberOfItems: c.people.length,
    itemListElement: c.people.map((p, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "Person", name: p.name, jobTitle: p.role, worksFor: { "@type": "Organization", name: p.org }, description: p.status, ...(p.url ? { url: p.url, sameAs: [p.url] } : {}), subjectOf: p.sources.map((s) => ({ "@type": "CreativeWork", url: s })) } })) };
}
