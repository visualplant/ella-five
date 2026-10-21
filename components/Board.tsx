import Link from "next/link";
import { formatUpdated, itemListLd, SITE, REPO, host, abs, ellaLd, ELLA_ID } from "@/lib/data";
import { vpath, type Vertical } from "@/lib/verticals";
import Tabs from "@/components/Tabs";
import GridHover from "@/components/GridHover";
import GitHubMark from "@/components/GitHubMark";

export default function Board({ v }: { v: Vertical }) {
  const categories = v.categories, data = v;
  const ld = [ellaLd(), { "@context": "https://schema.org", "@type": "WebSite", "@id": abs(vpath(v)) + "#website", name: `Ella – ${v.title}`, description: "Five people, five disciplines, every status sourced.", url: abs(vpath(v)) || SITE, inLanguage: "en", dateModified: data.updated, publisher: { "@id": ELLA_ID }, hasPart: categories.map((c) => ({ "@id": abs(vpath(v, c.slug)) + "#list" })) }, ...categories.map((c) => itemListLd(c, v))];
  return (
    <div className="board">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="b-head">
        <Link href="/about" className="b-id" aria-label="Ella – AI Talent Tracker. What about me? About Ella">
          <img src="/ella.webp" alt="" width="44" height="44" className="avatar" />
          <h1>Ella <span>– AI Talent Tracker</span></h1>
          <span className="b-what" aria-hidden="true">What about me?</span>
        </Link>
        <p className="b-upd">Updated <time dateTime={data.updated}>{formatUpdated(v.updated)}</time></p>
        <Link href="/subscribe" className="b-sub">Subscribe</Link>
      </header>
      <Tabs items={categories.map(({ slug, name }) => ({ slug, name }))} />
      <div className="cols">
        <div className="rays" aria-hidden="true"><i className="h t" /><i className="h b" /><i className="v l" /><i className="v r" /></div>
        <div className="col rail" aria-hidden="true">
          <h2>&nbsp;</h2>
          <ol>{[1, 2, 3, 4, 5].map((n) => <li key={n} data-rail={n}>{n}</li>)}</ol>
        </div>
        {categories.map((c, ci) => (
          <section key={c.slug} id={`col-${c.slug}`} className="col" aria-labelledby={`h-${c.slug}`}>
            <h2 id={`h-${c.slug}`}><Link href={vpath(v, c.slug)}>{c.name}</Link></h2>
            <ol>
              {c.people.map((p, i) => (
                <li key={p.name} data-row={i + 1} data-col={ci + 1}>
                  <span className="n" aria-hidden="true">{i + 1}</span>
                  <div>
                    <h3><a className="cell-link" href={p.sources[0] || p.url || undefined} target="_blank" rel="noopener noreferrer" aria-label={`${p.name}, ${p.role}, ${p.org}. ${p.short} (opens ${host(p.sources[0] || p.url || "")} in a new tab)`}>{p.name}<svg className="arr" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="butt" strokeLinejoin="miter"><path d="M1.5 22.5 22 2M10 1.5h12.5V14" /></svg></a></h3>
                    <p className="r">{p.role}<span>{p.org}</span></p>
                    <p className="s">{p.short}{!p.verified && <abbr title={p.note || "Unverified"}> ·&nbsp;unverified</abbr>}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <GridHover />
      <footer className="b-foot">
        <span>Statuses come from public sources and describe roles, not availability.</span>
        <GitHubMark />
      </footer>
    </div>
  );
}
