import Link from "next/link";
import type { Metadata } from "next";
import { abs, categories, formatUpdated } from "@/lib/data";
import { getMergedVotes, loadRising } from "@/lib/rising";
import CatIcon from "@/components/CatIcon";
import RisingStarsView from "@/components/RisingStarsView";
import SubscribeForm from "@/components/SubscribeForm";

export function generateMetadata(): Metadata {
  const r = loadRising();
  const full = "Rising Stars – Ella – AI Talent Tracker";
  return {
    title: "Rising Stars",
    description: r.blurb,
    alternates: { canonical: "/rising-stars" },
    openGraph: { type: "website", url: abs("/rising-stars"), title: full, description: r.blurb },
    twitter: { card: "summary_large_image", title: full, description: r.blurb },
  };
}

export default function RisingStarsPage() {
  const r = loadRising();
  const initialVotes = getMergedVotes(null);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": abs("/rising-stars") + "#list",
    name: "Ella: Rising Stars in AI",
    description: r.blurb,
    dateModified: r.updated,
    url: abs("/rising-stars"),
    numberOfItems: r.people.length,
    itemListElement: r.people.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        name: p.name,
        jobTitle: p.role,
        worksFor: { "@type": "Organization", name: p.org },
        description: p.status,
        url: p.url || p.sources[0],
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <section className="hero wrap compact cat-hero">
        <div className="cat-kick">
          <h1 className="cat-title">
            <CatIcon slug="rising" />
            Rising Stars
          </h1>
        </div>
        <p className="lede">{r.blurb}</p>
        <p className="updated">
          Last updated <time dateTime={r.updated}>{formatUpdated(r.updated)}</time>
        </p>
      </section>

      <RisingStarsView
        people={r.people}
        categories={categories.map(({ slug, name }) => ({ slug, name }))}
        initialVotes={initialVotes}
      />

      <nav className="pv-back cat-next wrap" aria-label="Back to grid">
        <Link href="/">← 5×5</Link>
      </nav>

      <section className="sub wrap">
        <SubscribeForm heading="Follow the lists" categories={categories.map(({ slug, name }) => ({ slug, name }))} />
      </section>
    </>
  );
}
