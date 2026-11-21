// Server-only catalog for the Tavus widget. WHITELIST ONLY: public name, role,
// org, category and profile hrefs. Never read list-members emails or /workspace/ella/private.
import { categories } from "@/lib/data";
import { people } from "@/lib/people";
import { categoryName, loadRising } from "@/lib/rising";
import { weekLabel, weeks } from "@/lib/weekly";
import type { EllaCatalog } from "@/lib/tavus-catalog";

export function loadEllaCatalog(): EllaCatalog {
  const listPeople = [...people().values()].map((e) => ({
    slug: e.slug,
    href: `/${e.home}/${e.slug}`,
    category: e.home,
    categoryName: categories.find((c) => c.slug === e.home)?.name || e.home,
    name: e.p.name,
    role: e.p.role,
    org: e.p.org,
  }));
  const seen = new Set(listPeople.map((p) => p.slug));
  const rising = loadRising().people
    .filter((p) => !seen.has(p.slug))
    .map((p) => ({
      slug: p.slug,
      href: `/rising-stars#${p.slug}`,
      category: "rising-stars",
      categoryName: categoryName(p.category) || "Rising Stars",
      name: p.name,
      role: p.role,
      org: p.org,
    }));

  return {
    people: [...listPeople, ...rising],
    weeks: weeks().map((date) => ({ date, label: weekLabel(date) })),
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
  };
}
