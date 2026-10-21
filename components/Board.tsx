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
        <h1>Ella <span>is {v.title}.</span></h1>
        <p className="b-upd">Updated <time dateTime={data.updated}>{formatUpdated(v.updated)}</time></p>
        <Link href="/subscribe" className="b-sub">Subscribe</Link>
      </header>
      <Tabs items={categories.map(({ slug, name }) => ({ slug, name }))} />
      <div className="cols">
        {categories.map((c, ci) => (
          <section key={c.slug} id={`col-${c.slug}`} className="col" aria-labelledby={`h-${c.slug}`}>
            <h2 id={`h-${c.slug}`}><Link href={vpath(v, c.slug)}>{c.name}</Link></h2>
            <ol>
              {c.people.map((p, i) => (
                <li key={p.name} data-row={i + 1} data-col={ci + 1} tabIndex={p.url ? undefined : 0}>
                  <span className="n">{i + 1}</span>
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
        <span>Built by <a href="https://jsn.io">Jason Schmidt</a>, who appears on the Design list · <a href={REPO}>Source</a></span>
      </footer>
    </div>
  );
}
