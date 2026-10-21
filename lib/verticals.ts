// Verticals registry. To add one (e.g. biotech): create data/verticals/biotech.json
// with the same shape as ai.json, import it here and append it to `verticals`.
// Routes /biotech and /biotech/<category> are generated automatically.
import ai from "@/data/verticals/ai.json";
export type Person = { name: string; url: string | null; role: string; org: string; status: string; verified: boolean; note: string | null; short: string; sources: string[] };
export type Category = { slug: string; name: string; blurb: string; people: Person[] };
export type Vertical = { slug: string; name: string; title: string; updated: string; categories: Category[] };
export const verticals = [ai] as Vertical[];
export const DEFAULT_VERTICAL = "ai"; // served at the root; /ai redirects to /
export const getVertical = (slug: string) => verticals.find((v) => v.slug === slug);
export const defaultVertical = getVertical(DEFAULT_VERTICAL)!;
export const extraVerticals = verticals.filter((v) => v.slug !== DEFAULT_VERTICAL);
export const vpath = (v: Vertical, cat?: string) => (v.slug === DEFAULT_VERTICAL ? "" : `/${v.slug}`) + (cat ? `/${cat}` : "") || "/";
