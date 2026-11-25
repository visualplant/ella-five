// Root-level segment: a category of the default (AI) vertical, or the home of another vertical.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { defaultVertical, extraVerticals, vpath } from "@/lib/verticals";
import { abs, getCategory } from "@/lib/data";
import CategoryView from "@/components/CategoryView";
import Board from "@/components/Board";
import { categoryTitle } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return [...defaultVertical.categories.map((c) => ({ category: c.slug })), ...extraVerticals.map((v) => ({ category: v.slug }))];
}
type P = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const s = (await params).category; const v = extraVerticals.find((x) => x.slug === s);
  if (v) return { title: { absolute: `Ella – ${v.title}` }, alternates: { canonical: vpath(v) }, openGraph: { type: "website", url: abs(vpath(v)) } };
  const c = getCategory(s); if (!c) return {};
  const title = categoryTitle(c);
  const description = `${c.blurb} ${c.people.map((p) => p.name).join(", ")}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${c.slug}` },
    openGraph: { type: "website", url: abs(`/${c.slug}`), title, description: c.blurb },
    twitter: { card: "summary_large_image", title, description: c.blurb },
  };
}
export default async function Page({ params }: P) {
  const s = (await params).category; const v = extraVerticals.find((x) => x.slug === s);
  if (v) return <Board v={v} />;
  const c = getCategory(s); if (!c) notFound();
  return <CategoryView v={defaultVertical} c={c} />;
}
