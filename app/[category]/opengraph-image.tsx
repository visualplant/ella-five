import { card, ogSize } from "@/lib/og";
import { defaultVertical, extraVerticals, getVertical } from "@/lib/verticals";
import { getCategory } from "@/lib/data";
export const size = ogSize; export const contentType = "image/png"; export const alt = "Ella – AI Talent Tracker";
export const dynamicParams = false;
export function generateStaticParams() { return [...defaultVertical.categories.map((c) => ({ category: c.slug })), ...extraVerticals.map((v) => ({ category: v.slug }))]; }
export default async function OG({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params; const c = getCategory(category, defaultVertical); const v = getVertical(category);
  if (c) return card({ eyebrow: "AI Talent Tracker", title: c.name, lines: [c.blurb] });
  return card({ eyebrow: v?.title ?? "Talent Tracker", title: v?.name ?? "Ella", lines: v ? [v.categories.map((x) => x.name).join(" · ")] : [] });
}
