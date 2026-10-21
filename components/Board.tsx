import Link from "next/link";
import { formatUpdated, itemListLd, SITE, REPO, host, abs } from "@/lib/data";
import { vpath, type Vertical } from "@/lib/verticals";
import Tabs from "@/components/Tabs";
import GridHover from "@/components/GridHover";
import GitHubMark from "@/components/GitHubMark";

export default function Board({ v }: { v: Vertical }) {
  const categories = v.categories, data = v;
  const ld = [{ "@context": "https://schema.org", "@type": "WebSite", name: `Ella – ${v.title}`, description: "Five people, five disciplines, every status sourced.", url: abs(vpath(v)), dateModified: data.updated }, ...categories.map((c) => itemListLd(c, v))];
  return (
    <div className="board">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="b-head">
        <img src="/ella.webp" alt="Ella, illustrated" width="44" height="44" className="avatar" />
        <h1>Ella <span>– AI Talent Tracker</span></h1>
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
                    <h3><a className="cell-link" href={p.sources[0] || p.url || undefined} target="_blank" rel="noopener noreferrer" aria-label={`${p.name}, ${p.role}, ${p.org}. ${p.short} (opens ${host(p.sources[0] || p.url || "")} in a new tab)`}>{p.name}</a></h3>
                    <p className="r">{p.role}<span>{p.org}</span></p>
                    <p className="s">{p.short}{!p.verified && <abbr title={p.note || "Unverified"}> ·&nbsp;unverified</abbr>}<span className="arr" aria-hidden="true"> ↗</span></p>
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
