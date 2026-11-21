// Client-safe catalog types and helpers for the Tavus Ella widget.
// No filesystem, emails, or private fields.

export type EllaPerson = {
  slug: string;
  href: string;
  category: string;
  categoryName: string;
  name: string;
  role: string;
  org: string;
};

export type EllaWeek = { date: string; label: string };

export type EllaCategory = { slug: string; name: string };

export type EllaCatalog = {
  people: EllaPerson[];
  weeks: EllaWeek[];
  categories: EllaCategory[];
};

export const TAVUS_DEPLOYMENT_ID = "99073ad1-8106-4888-ab6d-0a1307515445";

const PERSONA =
  "Ella is the site's AI talent tracker persona: she researches and maintains short, sourced, rotating top-five lists of exceptional people in AI across Technical, Design, Research, Product and Growth.";

const PAGES: Record<string, string> = {
  home: "/",
  "rising-stars": "/rising-stars",
  archive: "/archive",
  about: "/about",
  developers: "/developers",
};

export const OPEN_PAGE_IDS = ["home", "rising-stars", "archive", "about", "developers"] as const;
export type OpenPageId = (typeof OPEN_PAGE_IDS)[number];

function normalizePath(pathname: string) {
  const path = (pathname || "/").split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function pageContext(pathname: string, catalog: EllaCatalog): string {
  const path = normalizePath(pathname);

  if (path === "/") {
    return `The visitor is on the Ella – AI Talent Tracker homepage, viewing the current 5×5 list of exceptional people in AI across Technical, Design, Research, Product and Growth. ${PERSONA}`;
  }
  if (path === "/rising-stars") {
    return `The visitor is on the Rising Stars page of Ella – AI Talent Tracker, which highlights emerging people in AI. ${PERSONA}`;
  }
  if (path === "/about") {
    return `The visitor is on the About page of Ella – AI Talent Tracker, reading who Ella is and how the lists are made. ${PERSONA}`;
  }
  if (path === "/developers") {
    return `The visitor is on the Developers page of Ella – AI Talent Tracker, which documents the public API. ${PERSONA}`;
  }
  if (path === "/archive") {
    return `The visitor is on the archive index of Ella – AI Talent Tracker, listing past weekly 5×5 lists by publish date. ${PERSONA}`;
  }
  if (path === "/subscribe") {
    return `The visitor is on the subscribe page of Ella – AI Talent Tracker. ${PERSONA}`;
  }
  if (path === "/unsubscribe") {
    return `The visitor is on the unsubscribe page of Ella – AI Talent Tracker. ${PERSONA}`;
  }
  if (path === "/confirm") {
    return `The visitor is on the subscription confirmation page of Ella – AI Talent Tracker. ${PERSONA}`;
  }

  const archive = path.match(/^\/archive\/(\d{4}-\d{2}-\d{2})$/);
  if (archive) {
    const date = archive[1];
    const week = catalog.weeks.find((w) => w.date === date);
    if (week) {
      return `The visitor is viewing the archived 5×5 lists published on ${week.label} (${week.date}) on Ella – AI Talent Tracker. ${PERSONA}`;
    }
    return `The visitor is on an archive page dated ${date} on Ella – AI Talent Tracker. ${PERSONA}`;
  }

  const category = catalog.categories.find((c) => path === `/${c.slug}`);
  if (category) {
    return `The visitor is on the ${category.name} category page of Ella – AI Talent Tracker, viewing the current top five people in ${category.name}. ${PERSONA}`;
  }

  const parts = path.split("/").filter(Boolean);
  if (parts.length === 2) {
    const person =
      catalog.people.find((p) => p.href === path) ||
      catalog.people.find((p) => p.slug === parts[1] && p.category === parts[0]) ||
      catalog.people.find((p) => p.slug === parts[1] && !p.href.startsWith("/rising-stars"));
    if (person) {
      return `The visitor is viewing the profile of ${person.name}, ${person.role} at ${person.org}, in the ${person.categoryName} category on Ella – AI Talent Tracker. ${PERSONA}`;
    }
  }

  return `The visitor is on the ${path} page of Ella – AI Talent Tracker. ${PERSONA}`;
}

export function personBySlug(catalog: EllaCatalog, slug: string): EllaPerson | undefined {
  const clean = slug.trim();
  if (!clean) return undefined;
  return (
    catalog.people.find((p) => p.slug === clean && !p.href.startsWith("/rising-stars")) ||
    catalog.people.find((p) => p.slug === clean)
  );
}

export function categoryBySlug(catalog: EllaCatalog, slug: string): EllaCategory | undefined {
  const clean = slug.trim().toLowerCase();
  return catalog.categories.find((c) => c.slug === clean);
}

export function weekByDate(catalog: EllaCatalog, date: string): EllaWeek | undefined {
  const clean = date.trim();
  return catalog.weeks.find((w) => w.date === clean);
}

export function pathForPage(page: string): string | undefined {
  const clean = page.trim().toLowerCase();
  return PAGES[clean];
}
