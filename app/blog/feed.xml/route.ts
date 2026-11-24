import { loadPosts } from "@/lib/blog";
import { SITE } from "@/lib/data";

export const dynamic = "force-static";

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const posts = loadPosts();
  const items = posts.map((p) => {
    const url = `${SITE}/blog/${p.slug}`;
    const title = p.draft ? `Draft: ${p.title}` : p.example ? `Example post: ${p.title}` : p.title;
    const desc = p.draft ? `Draft: not yet published. ${p.excerpt}` : p.example ? `Example post: placeholder content. ${p.excerpt}` : p.excerpt;
    return `    <item>
      <title>${x(title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate>
      <category>${x(p.category)}</category>
      <description>${x(desc)}</description>
    </item>`;
  });
  const last = posts[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ella – blog</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Notes from Ella on the people and lists she keeps.</description>
    <language>en-us</language>
${last ? `    <lastBuildDate>${new Date(last.date + "T12:00:00Z").toUTCString()}</lastBuildDate>\n` : ""}${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
