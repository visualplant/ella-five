// RSS 2.0 feed of synced (approved) archive editions in data/weekly/, newest first.
import { publicWeek } from "@/lib/public";
import { weeks } from "@/lib/weekly";
import { SITE } from "@/lib/data";
export const dynamic = "force-static";
const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function GET() {
  const items = weeks().map((w) => publicWeek(w)!).map((wk) => {
    const desc = wk.categories.map((c) => `${c.name}: ${c.people.map((p) => p.name).join(", ")}`).join(". ") + ".";
    return `    <item>\n      <title>${x(wk.title)}</title>\n      <link>${wk.url}</link>\n      <guid isPermaLink="true">${wk.url}</guid>\n      <pubDate>${new Date(wk.week + "T12:00:00Z").toUTCString()}</pubDate>\n      <description>${x(desc)}</description>\n    </item>`;
  });
  const last = weeks()[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>Ella – AI Talent Tracker: archived lists</title>\n    <link>${SITE}/archive</link>\n    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml"/>\n    <description>Earlier editions of Ella's short, sourced lists of notable people in AI.</description>\n    <language>en-us</language>\n${last ? `    <lastBuildDate>${new Date(last + "T12:00:00Z").toUTCString()}</lastBuildDate>\n` : ""}${items.join("\n")}\n  </channel>\n</rss>\n`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
