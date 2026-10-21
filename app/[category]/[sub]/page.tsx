// /<vertical>/<category> for non-default verticals (empty until a second vertical is added).
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { extraVerticals, getVertical, vpath } from "@/lib/verticals";
import { getCategory } from "@/lib/data";
import CategoryView from "@/components/CategoryView";

export const dynamicParams = false;
export function generateStaticParams() {
  const p = extraVerticals.flatMap((v) => v.categories.map((c) => ({ category: v.slug, sub: c.slug })));
  return p.length ? p : [{ category: "_", sub: "_" }];
}
type P = { params: Promise<{ category: string; sub: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { category, sub } = await params; const v = getVertical(category); const c = v && getCategory(sub, v);
  return v && c ? { title: `Top ${c.name} talent in ${v.name}`, alternates: { canonical: vpath(v, c.slug) } } : {};
}
export default async function Page({ params }: P) {
  const { category, sub } = await params; const v = extraVerticals.find((x) => x.slug === category); const c = v && getCategory(sub, v);
  if (!v || !c) notFound();
  return <CategoryView v={v} c={c} />;
}
