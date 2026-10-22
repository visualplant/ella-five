// Per-person overrides from content/people/*.md (human-edited on GitHub).
// Each file overrides the matching person in a vertical, field by field; fields it leaves out
// fall back to the JSON data. Malformed files FAIL THE BUILD with a clear error, so a typo
// can never ship a broken or half-empty page.
import fs from "fs";
import path from "path";
import type { Person, Vertical } from "@/lib/verticals";

const DIR = path.join(process.cwd(), "content", "people");
const slug = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SCALAR = ["name", "url", "role", "org", "orgShort", "tag", "location", "status", "short", "signal", "note", "added", "verifiedHow"] as const;
const MEDIA = ["type", "id", "url", "caption", "credit", "alt", "link"] as const;
const SECTIONS: Record<string, string> = { status: "status", short: "short", signal: "signal", "why chosen": "why", "known for": "why", sources: "sources", "worked with": "workedWith", products: "products", "notable work": "notable", "public profiles": "profiles" };

function fail(file: string, msg: string): never { throw new Error(`content/people/${file}: ${msg}`); }
const link = (s: string) => { const m = s.match(/^\[([^\]]+)\]\((\S+)\)$/); return m ? { text: m[1].trim(), url: m[2] } : { text: s.trim(), url: undefined }; };

function parse(file: string, raw: string) {
  const src = raw.replace(/<!--[\s\S]*?-->/g, "").trim();
  const fm = src.match(/^---\s*\n([\s\S]*?)\n---\s*(\n|$)/);
  if (!fm) fail(file, "missing the '---' block of short fields at the top.");
  const meta: Record<string, string> = {};
  fm[1].split("\n").forEach((line, i) => {
    if (!line.trim() || line.trim().startsWith("#")) return;
    const m = line.match(/^([A-Za-z_]+)\s*:\s?(.*)$/);
    if (!m) fail(file, `line ${i + 2} of the top block should look like "field: value" (got "${line}").`);
    meta[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1");
  });
  const o: Partial<Person> & Record<string, unknown> = {};
  const media: Record<string, string> = {};
  let key = "";
  for (const [k, v] of Object.entries(meta)) {
    if (k === "slug") key = v;
    else if (k === "verified") { if (v !== "true" && v !== "false") fail(file, `verified must be true or false (got "${v}").`); o.verified = v === "true"; }
    else if (k.startsWith("media_") && (MEDIA as readonly string[]).includes(k.slice(6))) media[k.slice(6)] = v;
    else if ((SCALAR as readonly string[]).includes(k)) o[k] = v;
    else fail(file, `unknown field "${k}". Known fields: slug, verified, ${SCALAR.join(", ")}, ${MEDIA.map((m) => "media_" + m).join(", ")}.`);
  }
  if (Object.keys(media).length) {
    if (media.type !== "image" && media.type !== "youtube") fail(file, `media_type must be "image" or "youtube".`);
    o.media = media as Person["media"];
  }
  const body = src.slice(fm[0].length);
  for (const part of body.split(/^##\s+/m).slice(1)) {
    const nl = part.indexOf("\n");
    const title = (nl < 0 ? part : part.slice(0, nl)).trim();
    const text = (nl < 0 ? "" : part.slice(nl + 1)).trim();
    const field = SECTIONS[title.toLowerCase()];
    if (!field) fail(file, `unknown section "## ${title}". Known sections: ${Object.keys(SECTIONS).join(", ")}.`);
    if (["status", "short", "signal", "why"].includes(field)) { if (!text) fail(file, `section "## ${title}" is empty; delete it to fall back.`); o[field] = text.replace(/\s*\n\s*/g, " "); continue; }
    const items = text.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => { if (!l.startsWith("- ")) fail(file, `in "## ${title}", line ${i + 1} should start with "- " (got "${l}").`); return l.slice(2).trim(); });
    if (field === "sources") o.sources = items.map((s) => { if (!/^https?:\/\//.test(s)) fail(file, `"## Sources" items must be plain links (got "${s}").`); return s; });
    else if (field === "workedWith") o.workedWith = items.map((s) => {
      const parts = s.split(/,\s+(?![^\[]*\])/); const { text: name, url } = link(parts[0]);
      if (parts.length < 3) fail(file, `"## Worked with" items should be "- [Name](link), Role, Company" (got "${s}").`);
      return { name, role: parts.slice(1, -1).join(", "), org: parts[parts.length - 1], relation: "worked alongside", ...(url ? { url } : {}) };
    });
    else if (field === "products") o.products = items.map((s) => { const l = link(s); if (!l.url) fail(file, `"## Products" items should be "- [Name](link)".`); return { name: l.text, url: l.url }; });
    else if (field === "profiles") o.profiles = items.map((s) => { const l = link(s); if (!l.url) fail(file, `"## Public profiles" items should be "- [Label](link)".`); return { label: l.text, url: l.url }; });
    else if (field === "notable") o.notable = items.map((s) => { const l = link(s); return { title: l.text, ...(l.url ? { url: l.url } : {}) }; });
  }
  if (!key) key = slug(String(o.name || ""));
  if (!key) fail(file, "add a 'slug:' (or 'name:') field so the file can be matched to a person.");
  return { key, o };
}

export function applyPeopleOverrides(v: Vertical): Vertical {
  if (!fs.existsSync(DIR)) return v;
  for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith(".md")).sort()) {
    const { key, o } = parse(file, fs.readFileSync(path.join(DIR, file), "utf8"));
    const hits = v.categories.flatMap((c) => c.people.filter((p) => slug(p.name) === key));
    if (!hits.length) fail(file, `no person with slug "${key}" in data/verticals/${v.slug}.json.`);
    // Mutate in place so key order (and therefore output) stays identical to the JSON.
    for (const p of hits) Object.assign(p, o);
  }
  return v;
}
