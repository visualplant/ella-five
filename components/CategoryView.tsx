import Link from "next/link";
import { formatUpdated, itemListLd, abs, type Category } from "@/lib/data";
import { vpath, type Vertical } from "@/lib/verticals";
import PersonList from "@/components/PersonList";
import SubscribeForm from "@/components/SubscribeForm";
import CatIcon from "@/components/CatIcon";
import PersonNav from "@/components/PersonNav";

export default function CategoryView({ v, c }: { v: Vertical; c: Category }) {
  const categories = v.categories, data = v;
  const i = categories.indexOf(c); const nb = (d: number) => { const n = categories[(i + d + categories.length) % categories.length]; return { href: vpath(v, n.slug), name: n.name }; };
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ella", item: abs(vpath(v)) }, { "@type": "ListItem", position: 2, name: c.name }] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListLd(c, v), crumbs]) }} />
      <section className="hero wrap compact cat-hero">
        <div className="cat-kick"><h1 className="cat-title"><CatIcon slug={c.slug} />{c.name}</h1>{categories.length > 1 && <PersonNav prev={nb(-1)} next={nb(1)} />}</div>
        <p className="lede">{c.blurb}</p>
        <p className="updated">Last updated <time dateTime={data.updated}>{formatUpdated(v.updated)}</time></p>
      </section>
      <section className="cat wrap solo"><PersonList c={c} v={v} headingLevel={2} /></section>
      <nav className="pv-back cat-next wrap" aria-label="Back to grid"><Link href="/">← 5×5</Link></nav>
      <section className="sub wrap">
        <h2>Follow {c.name}</h2>
        <SubscribeForm categories={categories.map(({ slug, name }) => ({ slug, name }))} preset={[c.slug]} />
      </section>
    </>
  );
}
