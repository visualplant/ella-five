// Root-level segment: a category of the default (AI) vertical, or the home of another vertical.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { defaultVertical, extraVerticals, getVertical, vpath } from "@/lib/verticals";
import { getCategory } from "@/lib/data";
import CategoryView from "@/components/CategoryView";
import Board from "@/components/Board";

export const dynamicParams = false;
export function generateStaticParams() {
  return [...defaultVertical.categories.map((c) => ({ category: c.slug })), ...extraVerticals.map((v) => ({ category: v.slug }))];
}
type P = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = (await params).category; const v = extraVerticals.find((x) => x.slug === s);
  if (v) return { title: { absolute: `Ella – ${v.title}` }, alternates: { canonical: vpath(v) } };
  const c = getCategory(s); if (!c) return {};
  return { title: c.name, description: `${c.blurb} ${c.people.map((p) => p.name).join(", ")}.`, alternates: { canonical: `/${c.slug}` }, openGraph: { title: `${c.name} – Ella – AI Talent Tracker`, description: c.blurb }, twitter: { card: "summary_large_image", title: `${c.name} – Ella – AI Talent Tracker`, description: c.blurb } };
}
export default async function Page({ params }: P) {
  const s = (await params).category; const v = extraVerticals.find((x) => x.slug === s);
  if (v) return <Board v={v} />;
  const c = getCategory(s); if (!c) notFound();
  return <CategoryView v={defaultVertical} c={c} />;
}
