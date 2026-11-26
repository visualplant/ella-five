import { card, ogSize } from "@/lib/og";
import { getPost, loadPosts } from "@/lib/blog";
export const size = ogSize;
export const contentType = "image/png";
// Prerender one image per post at build time, like the page itself. Without this the image
// rendered on demand in a function that lacked the font files, and returned 500.
export const dynamicParams = false;
export function generateStaticParams() {
  return loadPosts().map((p) => ({ slug: p.slug }));
}
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return card({ eyebrow: "Blog", title: "Notes on talent." });
  return card({
    eyebrow: p.draft ? "Draft" : p.example ? "Example post" : "Blog",
    title: p.title,
    titleSize: p.title.length > 48 ? 72 : 88,
    lines: [p.excerpt],
    foot: `Ella · ${p.category} · ellafive.com`,
  });
}
