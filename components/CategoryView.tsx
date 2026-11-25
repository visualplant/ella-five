import Link from "next/link";
import { formatUpdated, itemListLd, SITE_URL, type Category } from "@/lib/data";
import { vpath, type Vertical } from "@/lib/verticals";
import PersonList from "@/components/PersonList";
import SubscribeForm from "@/components/SubscribeForm";
import CatIcon from "@/components/CatIcon";
import PersonNav from "@/components/PersonNav";
import { alumniInCategory, breadcrumbLd, categoryH1, categoryIntro } from "@/lib/seo";

export default function CategoryView({ v, c }: { v: Vertical; c: Category }) {
  const categories = v.categories, data = v;
  const i = categories.indexOf(c); const nb = (d: number) => { const n = categories[(i + d + categories.length) % categories.length]; return { href: vpath(v, n.slug), name: n.name }; };
  const crumbs = breadcrumbLd([{ name: "Home", url: SITE_URL }, { name: c.name }]);
  const intro = categoryIntro(c);
  const alumni = alumniInCategory(c.slug);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListLd(c, v), crumbs]) }} />
      <section className="hero wrap compact cat-hero">
        <div className="cat-kick">
          <p className="cat-title"><CatIcon slug={c.slug} />{c.name}</p>
          {categories.length > 1 && <PersonNav prev={nb(-1)} next={nb(1)} />}
        </div>
        <h1 className="cat-h1">{categoryH1(c)}</h1>
        <p className="lede">{intro || c.blurb}</p>
        <p className="updated">Last updated <time dateTime={data.updated}>{formatUpdated(v.updated)}</time></p>
      </section>
      <section className="cat wrap solo"><PersonList c={c} v={v} headingLevel={2} /></section>
      {alumni.length > 0 && (
        <section className="cat-alumni wrap" aria-labelledby="cat-alumni-h">
          <h2 id="cat-alumni-h">{`Everyone Ella has featured in ${c.name}`}</h2>
          <ul>
            {alumni.map((a) => (
              <li key={a.href}>
                <Link href={a.href}>{a.name}</Link>
                <span className="cat-alumni-meta">, {a.role}, {a.org}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <nav className="pv-back cat-next wrap" aria-label="Back to grid"><Link href="/">← 5×5</Link></nav>
      <section className="sub wrap">
        <SubscribeForm heading={`Follow ${c.name}`} categories={categories.map(({ slug, name }) => ({ slug, name }))} preset={[c.slug]} />
      </section>
    </>
  );
}
