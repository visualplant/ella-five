// /<category>/<person> for the default vertical, or /<vertical>/<category> for other verticals.
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { defaultVertical, extraVerticals, getVertical, vpath, ppath, pslug } from "@/lib/verticals";
import { getCategory } from "@/lib/data";
import CategoryView from "@/components/CategoryView";
import PersonView from "@/components/PersonView";

export const dynamicParams = false;
export function generateStaticParams() {
  return [
    ...defaultVertical.categories.flatMap((c) => c.people.map((p) => ({ category: c.slug, sub: pslug(p.name) }))),
    ...extraVerticals.flatMap((v) => v.categories.map((c) => ({ category: v.slug, sub: c.slug }))),
  ];
}
type P = { params: Promise<{ category: string; sub: string }> };
const person = (cat: string, sub: string) => { const c = getCategory(cat); const p = c?.people.find((q) => pslug(q.name) === sub); return c && p ? { c, p } : null; };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { category, sub } = await params;
  const hit = person(category, sub);
  if (hit) { const { c, p } = hit; const t = `${p.name} – ${c.name}`; return { title: t, description: `${p.role}, ${p.org}. ${p.short}`, alternates: { canonical: ppath(defaultVertical, c.slug, p.name) }, openGraph: { title: `${t} – Ella`, description: p.short } }; }
  const v = getVertical(category); const c = v && getCategory(sub, v);
  return v && c ? { title: { absolute: `${c.name} – Ella – ${v.title}` }, alternates: { canonical: vpath(v, c.slug) } } : {};
}
export default async function Page({ params }: P) {
  const { category, sub } = await params;
  const hit = person(category, sub);
  if (hit) return <PersonView v={defaultVertical} c={hit.c} p={hit.p} />;
  const v = extraVerticals.find((x) => x.slug === category); const c = v && getCategory(sub, v);
  if (!v || !c) notFound();
  return <CategoryView v={v} c={c} />;
}
