import Link from "next/link";
import { abs, host, formatUpdated, type Category, type Person } from "@/lib/data";
import { vpath, ppath, type Vertical } from "@/lib/verticals";
import CatIcon from "@/components/CatIcon";
import Media from "@/components/PersonMedia";
import PersonNav from "@/components/PersonNav";

// Per-person profile: narrow column (category, rank, name, media) + wide column of stacked label/value fields.
// Optional fields (why, products, notable, profiles, location, added, media) are hidden when absent;
// on preview deploys, missing "Why chosen" and media show clearly marked placeholders.
const PREVIEW = process.env.VERCEL_ENV !== "production";
const isLinkedIn = (u: string) => /linkedin\.com/.test(u);
type Row = [string, React.ReactNode];

function Arr() { return <svg className="pv-arr" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"><path d="M1.5 22.5 22 2M10 1.5h12.5V14" vectorEffect="non-scaling-stroke" /></svg>; }
function Ext({ href, children }: { href: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noopener nofollow">{children}<Arr /></a>; }
const Fields = ({ rows }: { rows: Row[] }) => <dl className="pv-facts">{rows.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}</dl>;

export default function PersonView({ v, c, p }: { v: Vertical; c: Category; p: Person }) {
  const rank = c.people.indexOf(p) + 1, n = c.people.length;
  const nb = (d: number) => { const i = (rank - 1 + d + n) % n; const q = c.people[i]; return { href: ppath(v, c.slug, q.name), name: q.name, rank: i + 1 }; };
  const media = p.media ? <Media m={p.media} name={p.name} /> : PREVIEW ? <div className="pv-media pv-ph"><span>Media (preview placeholder)</span><small>Talk, product screenshot or image by or of {p.name}</small></div> : null;
  const lead: Row[] = [["Known for", p.short]];
  if (p.why) lead.push(["Why chosen", p.why]); else if (PREVIEW) lead.push(["Why chosen", <span className="pv-phw" key="w">Ella’s blurb goes here (preview placeholder).</span>]);
  if (p.workedWith?.length) lead.push(["Worked with", <span className="pv-ww" key="ww">{p.workedWith.map((w) => { const sub = [w.role, w.org].filter(Boolean).join(", "); return <span key={w.name}>{w.url ? <Ext href={w.url}>{w.name}</Ext> : w.name}{sub && <span className="pv-mute">, {sub}</span>}</span>; })}</span>]);
  const rest: Row[] = [
    ["Role", <>{p.role}<span className="pv-mute">, {p.org}</span></>],
    ["Status", <>{p.tag && <span className="pv-tag">{p.tag}</span>}{p.status}{!p.verified && <> <span className="unverified" title={p.note || "Unverified"}>Unverified</span></>}</>],
  ];
  if (p.location) rest.push(["Current location", p.location]);
  if (p.url) rest.push(["Personal site", <Ext href={p.url} key="u">{host(p.url)}</Ext>]);
  if (p.products?.length) rest.push(["Products", <span className="pv-list" key="pr">{p.products.map((x) => <Ext key={x.url} href={x.url}>{x.name}</Ext>)}</span>]);
  if (p.notable?.length) rest.push(["Notable work", <span className="pv-list" key="n">{p.notable.map((x) => x.url ? <Ext key={x.title} href={x.url}>{x.title}</Ext> : <span key={x.title}>{x.title}</span>)}</span>]);
  if (p.profiles?.length) rest.push(["Public profiles", <span className="pv-list" key="pf">{p.profiles.map((x) => <Ext key={x.url} href={x.url}>{x.label}</Ext>)}</span>]);
  if (p.added) rest.push(["On the list since", <time key="a" dateTime={p.added}>{new Date(p.added + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" })}</time>]);
  rest.push(["Sources", <ol className="pv-links" key="s">{p.sources.map((s) => <li key={s}><Ext href={s}>{isLinkedIn(s) ? "LinkedIn" : host(s)}</Ext></li>)}</ol>]);
  rest.push(["Last checked", <time key="t" dateTime={v.updated}>{formatUpdated(v.updated)}</time>]);
  const ld = { "@context": "https://schema.org", "@type": "ProfilePage", url: abs(ppath(v, c.slug, p.name)), dateModified: v.updated,
    mainEntity: { "@type": "Person", name: p.name, jobTitle: p.role, affiliation: { "@type": "Organization", name: p.org }, description: p.short, url: p.url || undefined, ...(p.workedWith?.length ? { colleague: p.workedWith.map((w) => ({ "@type": "Person", name: w.name, ...(w.url ? { url: w.url } : {}) })) } : {}), ...(p.location ? { homeLocation: { "@type": "Place", name: p.location } } : {}), sameAs: [...new Set([...(p.url ? [p.url] : []), ...(p.profiles || []).map((y) => y.url), ...p.sources])] } };
  return <div className="pv-wrap wrap">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    <article className="pv">
      <div className="pv-main">
        <p className="pv-kick"><Link href={vpath(v, c.slug)} className="pv-cat"><CatIcon slug={c.slug} />{c.name}</Link><span className="pv-mute pv-no">No. {String(rank).padStart(2, "0")} of {String(c.people.length).padStart(2, "0")}</span>{c.people.length > 1 && <PersonNav prev={nb(-1)} next={nb(1)} />}</p>
        <h1 className="pv-name">{p.name}</h1>
        {media && <div className="pv-mslot pv-desk">{media}</div>}
      </div>
      <div className="pv-side">
        <Fields rows={lead} />
        {media && <div className="pv-mslot pv-mob">{media}</div>}
        <Fields rows={rest} />
      </div>
    </article>
    <nav className="pv-back"><Link href={vpath(v, c.slug)}>← All {c.name}</Link></nav>
  </div>;
}
