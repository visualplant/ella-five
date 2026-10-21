import Link from "next/link";
import { formatUpdated, itemListLd, SITE, REPO, host, abs } from "@/lib/data";
import { vpath, type Vertical } from "@/lib/verticals";
import Tabs from "@/components/Tabs";
import GridHover from "@/components/GridHover";

export default function Board({ v }: { v: Vertical }) {
  const categories = v.categories, data = v;
  const ld = [{ "@context": "https://schema.org", "@type": "WebSite", name: `Ella, ${v.title}`, url: abs(vpath(v)), dateModified: data.updated }, ...categories.map((c) => itemListLd(c, v))];
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
        <div className="col rail" aria-hidden="true">
          <h2>&nbsp;</h2>
          <ol>{[1, 2, 3, 4, 5].map((n) => <li key={n} data-rail={n}>{n}</li>)}</ol>
          <span className="more">&nbsp;</span>
        </div>
        {categories.map((c, ci) => (
          <section key={c.slug} id={`col-${c.slug}`} className="col" aria-labelledby={`h-${c.slug}`}>
            <h2 id={`h-${c.slug}`}><Link href={vpath(v, c.slug)}>{c.name}</Link></h2>
            <ol>
              {c.people.map((p, i) => (
                <li key={p.name} data-row={i + 1} data-col={ci + 1} tabIndex={p.url ? undefined : 0}>
                  <span className="n" aria-hidden="true">{i + 1}</span>
                  <div>
                    <h3>{p.url ? <a href={p.url} title={host(p.url)}>{p.name}</a> : p.name}</h3>
                    <p className="r">{p.role}<span>{p.org}</span></p>
                    <p className="s">{p.short}{!p.verified && <abbr title={p.note || "Unverified"}> ·&nbsp;unverified</abbr>}{" "}
                      <a className="src" href={p.sources[0]} rel="noopener nofollow" title={`Source: ${host(p.sources[0])}`} aria-label={`Source for ${p.name}: ${host(p.sources[0])}`}>↗</a></p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href={vpath(v, c.slug)} className="more">Sources and detail</Link>
          </section>
        ))}
      </div>
      <GridHover />
      <footer className="b-foot">
        <span>Statuses come from public sources and describe roles, not availability.</span>
        <a href={REPO} className="gh" aria-label="Source on GitHub" rel="noopener"><svg viewBox="0 0 16 16" width="19" height="19" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a>
      </footer>
    </div>
  );
}
