export type WorkedWith = { name: string; role?: string; org?: string; url?: string; relation?: string };
// Verticals registry. To add one (e.g. biotech): create data/verticals/biotech.json
// with the same shape as ai.json, import it here and append it to `verticals`.
// Routes /biotech and /biotech/<category> are generated automatically.
import ai from "@/data/verticals/ai.json";
export type Person = { name: string; url: string | null; role: string; org: string; status: string; verified: boolean; verifiedHow?: string; note: string | null; short: string; sources: string[]; signal?: string; tag?: string; orgShort?: string;
  // Optional profile fields (filled by Ella persona research; hidden when absent)
  why?: string; products?: { name: string; url: string }[]; profiles?: { label: string; url: string }[]; location?: string; workedWith?: WorkedWith[]; added?: string; notable?: { title: string; url?: string }[];
  media?: { type: "youtube" | "image"; id?: string; url?: string; caption?: string; credit?: string; alt?: string; link?: string } };
export type Category = { slug: string; name: string; blurb: string; people: Person[] };
export type Vertical = { slug: string; name: string; title: string; updated: string; categories: Category[] };
export const verticals = [ai] as Vertical[];
export const DEFAULT_VERTICAL = "ai"; // served at the root; /ai redirects to /
export const getVertical = (slug: string) => verticals.find((v) => v.slug === slug);
export const defaultVertical = getVertical(DEFAULT_VERTICAL)!;
export const extraVerticals = verticals.filter((v) => v.slug !== DEFAULT_VERTICAL);
export const vpath = (v: Vertical, cat?: string) => (v.slug === DEFAULT_VERTICAL ? "" : `/${v.slug}`) + (cat ? `/${cat}` : "") || "/";
export const pslug = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const ppath = (v: Vertical, cat: string, name: string) => vpath(v, cat) + "/" + pslug(name);
