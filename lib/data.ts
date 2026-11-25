import { SOCIALS, socialSameAs } from "@/lib/socials";
import { defaultVertical, pslug, vpath, type Vertical, type Category } from "@/lib/verticals";
import { profilePath } from "@/lib/people";
export type { Person, Category, Vertical } from "@/lib/verticals";
export const data = defaultVertical;
export const categories = defaultVertical.categories;
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://ellafive.com").replace(/\/$/, "");
export const SITE_URL = SITE + "/";
export const REPO = "https://github.com/visualplant/ella-five";
export const getCategory = (slug: string, v: Vertical = defaultVertical) => v.categories.find((c) => c.slug === slug);
export function formatUpdated(iso = data.updated) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) + " PT";
}
export const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");
export const abs = (path: string) => SITE + (path === "/" ? "" : path);
export function itemListLd(c: Category, v: Vertical = defaultVertical, opts?: { listUrl?: string; listId?: string }) {
  const listUrl = opts?.listUrl ?? abs(vpath(v, c.slug));
  const listId = opts?.listId ?? listUrl + "#list";
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": listId,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    name: `Ella: top ${c.name} talent in ${v.name}`,
    description: c.blurb,
    dateModified: v.updated,
    url: listUrl,
    numberOfItems: c.people.length,
    itemListElement: c.people.map((p, i) => {
      const path = profilePath(p.name) ?? `${vpath(v, c.slug)}/${pslug(p.name)}`;
      const id = abs(path) + "#person";
      const sameAs = [...new Set([...(p.url ? [p.url] : []), ...(p.profiles || []).map((y) => y.url)])];
      return {
        "@type": "ListItem",
        position: i + 1,
        url: abs(path),
        item: {
          "@type": "Person",
          "@id": id,
          name: p.name,
          jobTitle: p.role,
          worksFor: { "@type": "Organization", name: p.org },
          description: p.status,
          url: p.url || undefined,
          ...(sameAs.length ? { sameAs } : {}),
          subjectOf: p.sources.map((s) => ({ "@type": "CreativeWork", url: s })),
        },
      };
    }),
  };
}

export const ELLA_ID = SITE_URL + "#ella";
export const WEBSITE_ID = SITE_URL + "#website";
export const ellaLd = () => ({ "@context": "https://schema.org", "@type": "Organization", "@id": ELLA_ID, name: "Ella", alternateName: "Ella – AI Talent Tracker", url: SITE_URL, logo: SITE + "/ella.webp", image: SITE + "/ella.webp",
  description: "Ella researches and maintains short, sourced, rotating top-five lists of exceptional people in AI across Technical, Design, Research, Product and Growth.", sameAs: [REPO, ...socialSameAs()], ...(SOCIALS.email ? { email: SOCIALS.email, contactPoint: { "@type": "ContactPoint", contactType: "general", email: SOCIALS.email } } : {}) });
export const LICENSE_NOTE = "Lists are editorial and compiled from the public sources cited for each person. Statuses describe public role changes, not availability or intent to change jobs. Free to quote and share with attribution: \"Ella – AI Talent Tracker (https://ellafive.com)\". Code: MIT.";
