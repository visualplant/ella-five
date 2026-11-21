import Link from "next/link";
import type { Metadata } from "next";
import { SITE, ellaLd, ELLA_ID, categories } from "@/lib/data";
import { loadAbout } from "@/lib/about";
import VerifiedBadge from "@/components/VerifiedBadge";
import AboutStayInLoop from "@/components/AboutStayInLoop";
import TalkToElla from "@/components/TalkToElla";

// The word "Verified" in "it gets a Verified badge" renders as the live VerifiedBadge (sample popover).
const VB_RE = /a Verified badge/;
const VB_SAMPLE = "Ella confirmed this claim directly through public records or a neutral reference.";
const SUB_RE = /<p><a href="\/subscribe">Subscribe<\/a>[^<]*<\/p>/;

function splitAbout(html: string) {
  const i = html.search(VB_RE);
  if (i < 0) return null;
  const ul0 = html.lastIndexOf("<ul>", i), ul1 = html.indexOf("</ul>", i);
  if (ul0 < 0 || ul1 < 0) return null;
  const items = html.slice(ul0 + 4, ul1).split(/<\/li>\s*/).map((x) => x.replace(/^\s*<li>/, "")).filter((x) => x.trim());
  return { before: html.slice(0, ul0), after: html.slice(ul1 + 5), items };
}

function renderAfter(afterHtml: string) {
  const m = afterHtml.match(SUB_RE);
  if (!m || m.index === undefined) {
    return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: afterHtml }} />;
  }
  const pre = afterHtml.slice(0, m.index);
  const post = afterHtml.slice(m.index + m[0].length);
  const cats = categories.map(({ slug, name }) => ({ slug, name }));
  return (
    <>
      <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: pre }} />
      <AboutStayInLoop categories={cats} />
      <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: post }} />
    </>
  );
}

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
      {(() => {
        const sp = splitAbout(a.html);
        if (!sp) return <div className="about-body">{renderAfter(a.html)}</div>;
        return (
          <div className="about-body">
            <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: sp.before }} />
            <ul>
              {sp.items.map((it, k) => {
                const m = it.match(VB_RE);
                if (!m || m.index === undefined) return <li key={k} dangerouslySetInnerHTML={{ __html: it }} />;
                const pre = it.slice(0, m.index) + "a ", post = " badge" + it.slice(m.index + m[0].length);
                return <li key={k}><span dangerouslySetInnerHTML={{ __html: pre }} /><span className="vb-inline"><VerifiedBadge how={VB_SAMPLE} /></span><span dangerouslySetInnerHTML={{ __html: post }} /></li>;
              })}
            </ul>
            {renderAfter(sp.after)}
          </div>
        );
      })()}
      <figure className="about-portrait">
        <video className="portrait-video" autoPlay muted loop playsInline preload="auto" poster="/ella-portrait.webp" disablePictureInPicture disableRemotePlayback width="1024" height="768" aria-label="Portrait of Ella seated at a wooden desk by a window, holding her glasses">
          <source src="/ella-portrait.mp4" type="video/mp4" />
          <img src="/ella-portrait.webp" alt="Portrait of Ella seated at a wooden desk by a window, holding her glasses" width="1024" height="768" />
        </video>
        <img className="portrait-still" src="/ella-portrait.webp" alt="Portrait of Ella seated at a wooden desk by a window, holding her glasses" width="1024" height="768" loading="lazy" />
        <figcaption>Resolution Phase at Freud&rsquo;s Desk</figcaption>
      </figure>
      <div className="about-body about-coda"><p>Can you believe that is a painting of me?</p><p className="about-meet"><TalkToElla variant="about" label="Meet me" /></p></div>
      <Link href="/" className="back">← Back to the grid</Link>
    </section>
  );
}
