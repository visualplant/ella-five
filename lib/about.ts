import fs from "fs";
import path from "path";
import { marked } from "marked";
const FILE = path.join(process.cwd(), "content", "about.md");
export function loadAbout() {
  let src = fs.readFileSync(FILE, "utf8").replace(/<!--[\s\S]*?-->/g, "").trim();
  const meta: Record<string, string> = {};
  const fm = src.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (fm) { for (const line of fm[1].split("\n")) { const m = line.match(/^\s*([\w-]+)\s*:\s*(.*)$/); if (m) meta[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, ""); } src = src.slice(fm[0].length); }
  let heading = "About Ella";
  src = src.replace(/^#\s+(.+)$/m, (_, h) => { heading = h.trim(); return ""; });
  let html = marked.parse(src.trim(), { async: false, gfm: true }) as string;
  html = html.replace("<p>", '<p class="lede">').replace(/<a href="(https?:)/g, '<a rel="noopener" href="$1');
  const updated = meta.updated || fs.statSync(FILE).mtime.toISOString();
  return { title: meta.title || "About", description: meta.description || "", heading, html, updated };
}
