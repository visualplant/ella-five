import Link from "next/link";
import type { Metadata } from "next";
import { SITE, ellaLd, ELLA_ID } from "@/lib/data";
import { loadAbout } from "@/lib/about";
// Copy lives in content/about.md (rendered at build time).
export const dynamic = "force-static";
export function generateMetadata(): Metadata {
  const a = loadAbout(); const full = `${a.title} – Ella – AI Talent Tracker`;
  return { title: a.title, description: a.description, openGraph: { title: full, description: a.description }, twitter: { title: full, description: a.description }, alternates: { canonical: "/about" } };
}
export default function Page() {
  const a = loadAbout();
  const ld = [ellaLd(), { "@context": "https://schema.org", "@type": "AboutPage", "@id": SITE + "/about#page", url: SITE + "/about", name: `${a.title} – Ella – AI Talent Tracker`, description: a.description || "Who Ella is, what she tracks, why, and how picks are made.", inLanguage: "en", dateModified: a.updated, about: { "@id": ELLA_ID }, mainEntity: { "@id": ELLA_ID }, isPartOf: { "@type": "WebSite", url: SITE + "/" } }];
  return (
    <section className="hero wrap compact about">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="eyebrow">About</p>
      <div className="about-head">
        <img src="/ella.webp" alt="Ella, illustrated: glasses, black bob, mustard cardigan" width="72" height="72" className="avatar" />
        <h1>{a.heading}</h1>
      </div>
      <div className="about-body" dangerouslySetInnerHTML={{ __html: a.html }} />
      <Link href="/" className="back">← Back to the grid</Link>
    </section>
  );
}
