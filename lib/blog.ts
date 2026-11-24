// Blog posts from content/blog/*.md (written by Ella Blog).
// Front matter is parsed the same way as content/about.md: a simple --- block, no extra YAML library.
// Malformed files FAIL THE BUILD with a clear error, so a typo cannot ship a broken post.
import fs from "fs";
import path from "path";
import { marked } from "marked";
import { categories } from "@/lib/data";
import { people, profilePath } from "@/lib/people";

const DIR = path.join(process.cwd(), "content", "blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KNOWN = new Set(["title", "date", "category", "excerpt", "slug", "related", "draft", "example"]);

export type RelatedList = { slug: string; name: string; href: string };
export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  category: string;
  excerpt: string;
  related: RelatedList[];
  draft: boolean;
  example: boolean;
  html: string;
  file: string;
};

/** Visible status label for unpublished posts. */
export function postBanner(p: { draft: boolean; example: boolean }): string | null {
  if (p.draft) return "Draft: not yet published";
  if (p.example) return "Example post: placeholder content";
  return null;
}

function fail(file: string, msg: string): never {
  throw new Error(`content/blog/${file}: ${msg}`);
}

/** Resolve a list short name or slug to a public path. */
export function resolveList(raw: string): RelatedList | null {
  const key = raw.trim().toLowerCase().replace(/^\/+/, "");
  if (!key || key === "5x5" || key === "home" || key === "board" || key === "index") {
    return { slug: "5x5", name: "5×5", href: "/" };
  }
  if (key === "archive") return { slug: "archive", name: "Archive", href: "/archive" };
  if (key === "rising-stars" || key === "rising" || key === "risingstars") {
    return { slug: "rising-stars", name: "Rising Stars", href: "/rising-stars" };
  }
  const c = categories.find((x) => x.slug === key || x.name.toLowerCase() === key);
  if (c) return { slug: c.slug, name: c.name, href: `/${c.slug}` };
  return null;
}

export function formatPostDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(new Date(date + "T12:00:00Z"));
}

function parseFrontMatter(file: string, raw: string): { meta: Record<string, string>; body: string } {
  const src = raw.replace(/^\uFEFF/, "").replace(/<!--[\s\S]*?-->/g, "").trim();
  const fm = src.match(/^---\s*\n([\s\S]*?)\n---\s*(\n|$)/);
  if (!fm) fail(file, "missing the '---' block of fields at the top.");
  const meta: Record<string, string> = {};
  const lines = fm[1].split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    i++;
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!m) fail(file, `front matter should look like "field: value" (got "${line}").`);
    const key = m[1].toLowerCase();
    if (!KNOWN.has(key)) fail(file, `unknown field "${m[1]}". Known fields: ${[...KNOWN].join(", ")}.`);
    let val = m[2].trim();
    if (val === "" && i < lines.length && /^\s+-\s+/.test(lines[i])) {
      const items: string[] = [];
      while (i < lines.length) {
        const li = lines[i].match(/^\s+-\s+(.*)$/);
        if (!li) break;
        items.push(li[1].trim());
        i++;
      }
      val = items.join(", ");
    }
    meta[key] = val.replace(/^["']|["']$/g, "");
  }
  return { meta, body: src.slice(fm[0].length) };
}

function rewriteLinks(file: string, src: string): string {
  let out = src.replace(/\[\[([^\]]+)\]\]/g, (full, inner: string) => {
    const t = String(inner).trim();
    const list = t.match(/^list:\s*(.+)$/i);
    if (list) {
      const r = resolveList(list[1]);
      if (!r) fail(file, `unknown list in "${full}". Use a category slug (design, technical, …), 5x5, archive, or rising-stars.`);
      return `[${r.name}](${r.href})`;
    }
    const href = profilePath(t);
    if (!href) fail(file, `no person named "${t}" in "[[${t}]]". Use the name as it appears on their card.`);
    return `[${t}](${href})`;
  });
  out = out.replace(/\[([^\]]+)\]\(\s*(person|list):\s*([^)]+?)\s*\)/gi, (full, text: string, kind: string, target: string) => {
    const want = target.trim();
    if (kind.toLowerCase() === "list") {
      const r = resolveList(want);
      if (!r) fail(file, `unknown list in "${full}".`);
      return `[${text}](${r.href})`;
    }
    const href = profilePath(want) || [...people().values()].find((e) => e.slug === want.toLowerCase() || e.p.name.toLowerCase() === want.toLowerCase());
    if (typeof href === "string") return `[${text}](${href})`;
    if (href) return `[${text}](/${href.home}/${href.slug})`;
    fail(file, `no person matching "${want}" in "${full}".`);
  });
  return out;
}

function decorateHtml(html: string): string {
  const profiles = new Set([...people().values()].map((e) => `/${e.home}/${e.slug}`));
  return html
    .replace(/<a href="(https?:)/g, '<a rel="noopener" href="$1')
    .replace(/<a href="(\/[^"]*)"/g, (m, href: string) => (profiles.has(href) ? `<a class="blog-person" href="${href}"` : m));
}

function parseFile(file: string, raw: string): BlogPost {
  const { meta, body } = parseFrontMatter(file, raw);
  const title = (meta.title || "").trim();
  if (!title) fail(file, 'add a "title:" field.');
  const date = (meta.date || "").trim();
  if (!DATE_RE.test(date)) fail(file, `"date:" must be YYYY-MM-DD (got "${date || "empty"}").`);
  const excerpt = (meta.excerpt || "").trim();
  if (!excerpt) fail(file, 'add an "excerpt:" field (used on the index and in RSS).');
  const slug = (meta.slug || file.replace(/\.md$/, "")).trim();
  if (!SLUG_RE.test(slug)) fail(file, `"slug" must be lowercase kebab-case (got "${slug}").`);
  const category = (meta.category || "Notes").trim();
  if (!category) fail(file, `"category:" is empty.`);
  const boolField = (key: "draft" | "example") => {
    if (!(key in meta)) return false;
    const raw = meta[key].trim().toLowerCase();
    if (raw !== "true" && raw !== "false") fail(file, `"${key}" must be true or false (got "${meta[key]}").`);
    return raw === "true";
  };
  const draft = boolField("draft");
  const example = boolField("example");
  const related: RelatedList[] = [];
  const seen = new Set<string>();
  for (const part of (meta.related || "").split(",").map((s) => s.trim()).filter(Boolean)) {
    const r = resolveList(part);
    if (!r) fail(file, `unknown related list "${part}". Use a category slug, 5x5, archive, or rising-stars.`);
    if (seen.has(r.slug)) continue;
    seen.add(r.slug);
    related.push(r);
  }
  const markdown = rewriteLinks(file, body.trim());
  if (!markdown) fail(file, "the post body is empty.");
  const html = decorateHtml(marked.parse(markdown, { async: false, gfm: true }) as string);
  return { slug, title, date, category, excerpt, related, draft, example, html, file };
}

let cache: BlogPost[] | null = null;

export function loadPosts(): BlogPost[] {
  if (cache) return cache;
  if (!fs.existsSync(DIR)) return (cache = []);
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md") && f !== "README.md" && !f.startsWith("_"));
  const posts = files.map((file) => parseFile(file, fs.readFileSync(path.join(DIR, file), "utf8")));
  const slugs = new Map<string, string>();
  for (const p of posts) {
    const prev = slugs.get(p.slug);
    if (prev) fail(p.file, `slug "${p.slug}" is already used by ${prev}.`);
    slugs.set(p.slug, p.file);
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)));
  return (cache = posts);
}

export function getPost(slug: string): BlogPost | undefined {
  return loadPosts().find((p) => p.slug === slug);
}
