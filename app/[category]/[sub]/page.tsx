// /<category>/<person> for the default vertical, or /<vertical>/<category> for other verticals.
import { notFound, permanentRedirect } from "next/navigation";
import { people } from "@/lib/people";
import type { Metadata } from "next";
import { defaultVertical, extraVerticals, getVertical, vpath, ppath, pslug } from "@/lib/verticals";
import { getCategory } from "@/lib/data";
import CategoryView from "@/components/CategoryView";
import PersonView from "@/components/PersonView";

export const dynamicParams = false;
export function generateStaticParams() {
  return [
    ...[...people().values()].flatMap((e) => e.cats.map((cat) => ({ category: cat, sub: e.slug }))),
    ...extraVerticals.flatMap((v) => v.categories.map((c) => ({ category: v.slug, sub: c.slug }))),
  ];
}
type P = { params: Promise<{ category: string; sub: string }> };
const person = (cat: string, sub: string) => { const e = people().get(sub); return e && e.cats.includes(cat) ? e : null; };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { category, sub } = await params;
  const hit = person(category, sub);
  if (hit) { const { c, p } = hit; const t = `${p.name} – Ella`; return { title: { absolute: t }, description: `${p.role}, ${p.org}. ${p.short}`, alternates: { canonical: `/${hit.home}/${hit.slug}` }, openGraph: { title: t, description: p.short }, twitter: { title: t, description: p.short } }; }
  const v = getVertical(category); const c = v && getCategory(sub, v);
  return v && c ? { title: { absolute: `${c.name} – Ella – ${v.title}` }, alternates: { canonical: vpath(v, c.slug) } } : {};
}
export default async function Page({ params }: P) {
  const { category, sub } = await params;
  const hit = person(category, sub);
  if (hit) { if (hit.home !== category) permanentRedirect(`/${hit.home}/${hit.slug}`); return <PersonView v={hit.v} c={hit.c} p={hit.p} appeared={hit.appeared} />; }
  const v = extraVerticals.find((x) => x.slug === category); const c = v && getCategory(sub, v);
  if (!v || !c) notFound();
  return <CategoryView v={v} c={c} />;
}
