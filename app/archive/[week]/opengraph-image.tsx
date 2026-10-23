import { card, ogSize } from "@/lib/og";
import { weeks, getWeek, weekLabel } from "@/lib/weekly";
export const size = ogSize; export const contentType = "image/png"; export const alt = "Ella – archived lists";
export const dynamicParams = false;
export function generateStaticParams() { return weeks().map((week) => ({ week })); }
export default async function OG({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params; const v = getWeek(week);
  return card({ eyebrow: "Archive", title: `Lists from ${weekLabel(week)}`, titleSize: 92, lines: v ? [v.categories.map((c) => c.name).join(" · ")] : [] });
}
