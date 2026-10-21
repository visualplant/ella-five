import Link from "next/link";
import { formatUpdated, itemListLd, abs, type Category } from "@/lib/data";
import { vpath, type Vertical } from "@/lib/verticals";
import PersonList from "@/components/PersonList";
import SubscribeForm from "@/components/SubscribeForm";

export default function CategoryView({ v, c }: { v: Vertical; c: Category }) {
  const categories = v.categories, data = v;
  const i = categories.indexOf(c); const next = categories[(i + 1) % categories.length];
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Ella", item: abs(vpath(v)) }, { "@type": "ListItem", position: 2, name: c.name }] };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([itemListLd(c, v), crumbs]) }} />
      <section className="hero wrap compact">
        <p className="eyebrow"><Link href={vpath(v)}>Ella</Link> / {String(i + 1).padStart(2, "0")}</p>
        <h1>{c.name}</h1>
        <p className="lede">{c.blurb}</p>
        <p className="updated">Last updated <time dateTime={data.updated}>{formatUpdated(v.updated)}</time></p>
      </section>
      <section className="cat wrap solo"><PersonList c={c} headingLevel={2} /></section>
      <section className="sub wrap">
        <h2>Follow {c.name}</h2>
        <SubscribeForm categories={categories.map(({ slug, name }) => ({ slug, name }))} preset={[c.slug]} />
      </section>
      <nav className="next wrap" aria-label="Next list"><Link href={vpath(v, next.slug)}>Next: {next.name} →</Link></nav>
    </>
  );
}
