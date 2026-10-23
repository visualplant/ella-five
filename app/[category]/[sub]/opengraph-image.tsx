import { card, ogSize } from "@/lib/og";
import { people } from "@/lib/people";
import { extraVerticals, getVertical } from "@/lib/verticals";
import { getCategory } from "@/lib/data";
import { cityLevel } from "@/lib/public";
export const size = ogSize; export const contentType = "image/png"; export const alt = "Ella – AI Talent Tracker profile";
export const dynamicParams = false;
export function generateStaticParams() {
  return [...[...people().values()].flatMap((e) => e.cats.map((cat) => ({ category: cat, sub: e.slug }))), ...extraVerticals.flatMap((v) => v.categories.map((c) => ({ category: v.slug, sub: c.slug })))];
}
export default async function OG({ params }: { params: Promise<{ category: string; sub: string }> }) {
  const { category, sub } = await params; const e = people().get(sub);
  if (e && e.cats.includes(category)) {
    const p = e.p; const ro = [p.role, p.org].filter(Boolean).join(", "); const loc = cityLevel(p.location);
    return card({ eyebrow: e.c.name, title: p.name, lines: [ro.length > 90 ? ro.slice(0, 88).trimEnd() + "…" : ro, ...(loc ? [loc] : [])] });
  }
  const v = getVertical(category); const c = v && getCategory(sub, v);
  return card({ eyebrow: v?.title ?? "AI Talent Tracker", title: c?.name ?? "Ella", lines: c ? [c.blurb] : [] });
}
