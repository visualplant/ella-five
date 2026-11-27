// Ella 5x5 list-holder badges: THE one config file. Edit wording, formats, sizes and snippets here.
// Pure (no fs), so the client component can import it.
//
// How it fits together (nothing per person, nothing manual):
//   data/weekly/*.json (published weeks)  -> lib/badge-data.ts finds every appearance (week, category, rank)
//   -> app/badge/[week]/[category]/[file]/route.ts renders each SVG at build time (artwork: lib/badge-svg.ts)
//   -> components/PersonView.tsx includes <BadgeEmbed> on every profile with >= 1 appearance
//   -> components/BadgeEmbed.tsx is the whole UI (badge, label, dialog, snippets, PNG download).
// Adding a new weekly file produces its badges, archive cell anchors (#col-design-3) and profile includes on the next build.
// Same origin rule as lib/data.ts (kept local so client components avoid lib/data's server imports).
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://ellafive.com").replace(/\/$/, "");

/** Profile label above the badge. One constant so the wording can change in one place. */
export const BADGE_LABEL = "Add this badge to your site";

/** Every other piece of visible wording in the badge UI. */
export const BADGE_TEXT = {
  themeGroup: "Badge theme",
  themes: { auto: "Auto", light: "Always light", dark: "Always dark" },
  tabsGroup: "Embed format",
  tabs: { html: "HTML", md: "Markdown", link: "Link" },
  tabLabels: { html: "HTML embed code", md: "Markdown embed code, for GitHub READMEs", link: "Link to the list" },
  picker: "List",
  copy: "Copy",
  copied: "Copied",
  download: "Download PNG",
  close: "Close",
  preview: "Preview",
} as const;

export type BadgeTheme = "light" | "dark";
export type BadgeAppearance = { week: string; category: string; name: string; rank: number };

/** Every theme shares one 39px-tall slot, so an embed never jumps when the theme changes. */
export const BADGE_HEIGHT = 39;
/** Natural widths of the artwork per category (from the Figma frames). */
export const BADGE_WIDTHS: Record<string, number> = { design: 125, technical: 155, product: 141, research: 148, growth: 135 };

export const pad2 = (n: number) => String(n).padStart(2, "0");
/** "Nov 23, 2026" */
export const badgeWeekLabel = (week: string) => new Date(week + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
/** Alt and title text: "Ella 5x5 · Design no. 3" (always "no. N", never "#"). */
export const badgeTitle = (a: Pick<BadgeAppearance, "name" | "rank">) => `Ella 5x5 · ${a.name} no. ${a.rank}`;
/** Dialog subtitle and picker option: "Design no. 3 · Week of Nov 23, 2026". */
export const badgeSubtitle = (a: Pick<BadgeAppearance, "name" | "rank" | "week">) => `${a.name} no. ${a.rank} · Week of ${badgeWeekLabel(a.week)}`;
/** Downloaded PNG file name (2x). */
export const badgePngName = (a: Pick<BadgeAppearance, "week" | "category" | "rank">, theme: BadgeTheme) => `ella-5x5-${a.week}-${a.category}-${pad2(a.rank)}-${theme}@2x.png`;
export const badgePath = (a: Pick<BadgeAppearance, "week" | "category" | "rank">, theme: BadgeTheme) => `/badge/${a.week}/${a.category}/${pad2(a.rank)}-${theme}.svg`;
export const badgeTarget = (a: Pick<BadgeAppearance, "week" | "category" | "rank">) => `/archive/${a.week}#col-${a.category}-${a.rank}`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Default HTML: follows the visitor's color scheme. `force` swaps in a single-theme image. */
export function badgeHtml(a: BadgeAppearance, force?: BadgeTheme) {
  const t = esc(badgeTitle(a)), href = SITE + badgeTarget(a);
  const img = (theme: BadgeTheme) => `<img src="${SITE + badgePath(a, theme)}" alt="${t}" width="${BADGE_WIDTHS[a.category]}" height="${BADGE_HEIGHT}">`;
  if (force) return `<a href="${href}" title="${t}">\n  ${img(force)}\n</a>`;
  return [
    `<a href="${href}" title="${t}">`,
    `  <picture>`,
    `    <source media="(prefers-color-scheme: dark)" srcset="${SITE + badgePath(a, "dark")}">`,
    `    ${img("light")}`,
    `  </picture>`,
    `</a>`,
  ].join("\n");
}

/** Markdown tab. GitHub READMEs render <picture>, so the theme-aware default is the same HTML;
 *  a forced theme uses plain Markdown image syntax. */
export function badgeMarkdown(a: BadgeAppearance, force?: BadgeTheme) {
  if (!force) return badgeHtml(a);
  return `[![${badgeTitle(a)}](${SITE + badgePath(a, force)})](${SITE + badgeTarget(a)})`;
}

export const badgeLink = (a: BadgeAppearance) => SITE + badgeTarget(a);
