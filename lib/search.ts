// Public search index for the header autocomplete. WHITELIST ONLY: name, role, org,
// category labels and profile hrefs. Never read list-members emails or /workspace/ella/private.
import { categories } from "@/lib/data";
import { people } from "@/lib/people";
import type { Person } from "@/lib/data";
import { categoryName, loadRising } from "@/lib/rising";

export type SearchHit = {
  id: string;
  name: string;
  href: string;
  secondary: string;
  keywords: string[];
};

function line(role: string, org: string, place: string) {
  const who = [role, org].filter((s) => s && s.trim()).join(" · ");
  return who ? `${who} · ${place}` : place;
}

// Every public text field on the profile page, so a search for anything written there
// (e.g. a full name mentioned in "Why chosen") finds the person.
function profileText(p: Person): string[] {
  return [
    p.orgShort, p.tag, p.location, p.status, p.short, p.signal, p.why,
    ...(p.products ?? []).map((x) => x.name),
    ...(p.notable ?? []).map((x) => x.title),
  ].filter((s): s is string => !!s && !!s.trim());
}

export function searchPeople(): SearchHit[] {
  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  for (const e of people().values()) {
    const homeName = categories.find((c) => c.slug === e.home)?.name || e.home;
    const catNames = e.cats.map((slug) => categories.find((c) => c.slug === slug)?.name || slug);
    hits.push({
      id: `list:${e.slug}`,
      name: e.p.name,
      href: `/${e.home}/${e.slug}`,
      secondary: line(e.p.role, e.p.org, homeName),
      keywords: [e.p.role, e.p.org, ...catNames, ...profileText(e.p)].filter(Boolean),
    });
    seen.add(e.slug);
  }

  for (const p of loadRising().people) {
    if (seen.has(p.slug)) continue;
    const cat = categoryName(p.category);
    hits.push({
      id: `rising:${p.slug}`,
      name: p.name,
      href: `/rising-stars#${p.slug}`,
      secondary: line(p.role, p.org, "Rising Stars"),
      keywords: [p.role, p.org, cat, "Rising Stars"].filter(Boolean),
    });
    seen.add(p.slug);
  }

  return hits;
}
