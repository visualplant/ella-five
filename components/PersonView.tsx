import Link from "next/link";
import VerifiedBadge from "@/components/VerifiedBadge";
import { abs, host, formatUpdated, SITE_URL, type Category, type Person } from "@/lib/data";
import { groupSources } from "@/lib/sources";
import { vpath, ppath, type Vertical } from "@/lib/verticals";
import CatIcon from "@/components/CatIcon";
import Media from "@/components/PersonMedia";
import PersonNav from "@/components/PersonNav";
import ShareButton from "@/components/ShareButton";
import BadgeEmbed from "@/components/BadgeEmbed";
import { appearancesFor } from "@/lib/badge-data";
import { profilePath } from "@/lib/people";
import { weekLabel } from "@/lib/weekly";
import { pslug } from "@/lib/verticals";
import { publicVisibility } from "@/lib/visibility";
import "@/lib/public";
import VisibilityMeter from "@/components/VisibilityMeter";
import {
  breadcrumbLd,
  firstAppearance,
  isSeoFrozen,
  personId,
  personSameAs,
  personSubjectOf,
  personTitle,
  postsMentioningPath,
} from "@/lib/seo";

// Per-person profile: narrow column (category, rank, name, media) + wide column of stacked label/value fields.
// Optional fields (why, products, notable, profiles, location, added, media) are hidden when absent;
// on preview deploys, a missing "Why chosen" shows clearly marked placeholders.
const PREVIEW = process.env.VERCEL_ENV !== "production";
type Row = { label: string; value: React.ReactNode; heading?: boolean };

function Arr() { return <svg className="pv-arr" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"><path d="M1.5 22.5 22 2M10 1.5h12.5V14" vectorEffect="non-scaling-stroke" /></svg>; }
function Ext({ href, children }: { href: string; children: React.ReactNode }) { return <a href={href} target="_blank" rel="noopener nofollow">{children}<Arr /></a>; }
const Fields = ({ rows }: { rows: Row[] }) => (
  <div className="pv-facts">
    {rows.map((row) => (
      <div key={row.label}>
        {row.heading ? <h2>{row.label}</h2> : <p className="pv-dt">{row.label}</p>}
        <div className="pv-dd">{row.value}</div>
      </div>
    ))}
  </div>
);
const FrozenFields = ({ rows }: { rows: [string, React.ReactNode][] }) => (
  <dl className="pv-facts">{rows.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}</dl>
);

export default function PersonView({ v, c, p, appeared = [] }: { v: Vertical; c: Category; p: Person; appeared?: string[] }) {
  const href = (name: string) => profilePath(name) ?? ppath(v, c.slug, name);
  const path = href(p.name);
  const frozen = isSeoFrozen(pslug(p.name));
  const rank = c.people.indexOf(p) + 1, n = c.people.length;
  const nb = (d: number) => { const i = (rank - 1 + d + n) % n; const q = c.people[i]; return { href: href(q.name), name: q.name, rank: i + 1 }; };
  const media = p.media ? <Media m={p.media} name={p.name} /> : null;
  // Ella 5x5 badge: automatic on every profile with at least one published list appearance (none otherwise).
  const badges = appearancesFor(pslug(p.name));
  const badge = badges.length ? <BadgeEmbed appearances={badges} /> : null;
  const whyValue = p.why ? <>{p.why.split(/(\*\*[^*]+\*\*)/g).map((t, i) => /^\*\*[^*]+\*\*$/.test(t) ? <strong key={i}>{t.slice(2, -2)}</strong> : t)}</> : PREVIEW ? <span className="pv-phw" key="w">Ella’s blurb goes here (preview placeholder).</span> : null;
  const workedWith = p.workedWith?.length ? <span className="pv-ww" key="ww">{p.workedWith.map((w) => { const sub = [w.role, w.org].filter(Boolean).join(", "); return <span key={w.name}>{w.url ? <Ext href={w.url}>{w.name}</Ext> : w.name}{sub && <span className="pv-mute">, {sub}</span>}</span>; })}</span> : null;
  const roleValue = <>{p.role}<span className="pv-mute">, {p.org}</span></>;
  const signalValue = <>{p.tag && <span className="pv-tag">{p.tag}</span>}{p.status}{p.verified && <> <VerifiedBadge how={p.verifiedHow} /></>}</>;
  const vis = publicVisibility(pslug(p.name));
  const sourcesValue = (
    <ol className="pv-links" key="s">
      {groupSources(p.sources).map((g) => (
        <li key={g.key}>
          <Ext href={g.href}>{g.label}</Ext>
          {g.children.length > 0 && (
            <ul className="pv-sublinks">
              {g.children.map((ch) => (
                <li key={ch.href}>
                  <span className="pv-sub-dash" aria-hidden="true">- </span>
                  <Ext href={ch.href}>{ch.label}</Ext>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
  const appearedValue = appeared.length ? <span className="pv-list" key="ap">{appeared.map((w) => <Link key={w} href={`/archive/${w}`}>Lists from {weekLabel(w)}</Link>)}</span> : null;
  const checked = p.updated || v.updated;

  const frozenRows: [string, React.ReactNode][] = [["Known for", p.short]];
  if (whyValue) frozenRows.push(["Why chosen", whyValue]);
  if (workedWith) frozenRows.push(["Worked with", workedWith]);
  frozenRows.push(["Role", roleValue], ["Signal", signalValue]);
  if (vis) frozenRows.push(["Visibility", <VisibilityMeter vis={vis} key="vis" />]);
  if (p.location) frozenRows.push(["Current location", p.location]);
  if (p.url) frozenRows.push(["Personal site", <Ext href={p.url} key="u">{host(p.url)}</Ext>]);
  if (p.products?.length) frozenRows.push(["Products", <span className="pv-list" key="pr">{p.products.map((x) => <Ext key={x.url} href={x.url}>{x.name}</Ext>)}</span>]);
  if (p.notable?.length) frozenRows.push(["Notable work", <span className="pv-list" key="n">{p.notable.map((x) => x.url ? <Ext key={x.title} href={x.url}>{x.title}</Ext> : <span key={x.title}>{x.title}</span>)}</span>]);
  if (p.profiles?.length) frozenRows.push(["Public profiles", <span className="pv-list" key="pf">{p.profiles.map((x) => <Ext key={x.url} href={x.url}>{x.label}</Ext>)}</span>]);
  if (p.added) frozenRows.push(["On the list since", <time key="a" dateTime={p.added}>{new Date(p.added + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" })}</time>]);
  if (appearedValue) frozenRows.push(["Appeared in", appearedValue]);
  frozenRows.push(["Sources", sourcesValue], ["Last checked", <time key="t" dateTime={checked}>{formatUpdated(checked)}</time>]);

  const rows: Row[] = [{ label: "Known for", value: p.short }];
  if (whyValue) rows.push({ label: "Why chosen", value: whyValue, heading: true });
  if (workedWith) rows.push({ label: "Worked with", value: workedWith });
  rows.push({ label: "Role", value: roleValue, heading: true }, { label: "Signal", value: signalValue });
  if (vis) rows.push({ label: "Visibility", value: <VisibilityMeter vis={vis} key="vis" /> });
  if (p.location) rows.push({ label: "Current location", value: p.location });
  if (p.url) rows.push({ label: "Personal site", value: <Ext href={p.url} key="u">{host(p.url)}</Ext> });
  if (p.products?.length) rows.push({ label: "Products", value: <span className="pv-list" key="pr">{p.products.map((x) => <Ext key={x.url} href={x.url}>{x.name}</Ext>)}</span> });
  if (p.notable?.length) rows.push({ label: "Notable work", value: <span className="pv-list" key="n">{p.notable.map((x) => x.url ? <Ext key={x.title} href={x.url}>{x.title}</Ext> : <span key={x.title}>{x.title}</span>)}</span> });
  if (p.profiles?.length) rows.push({ label: "Public profiles", value: <span className="pv-list" key="pf">{p.profiles.map((x) => <Ext key={x.url} href={x.url}>{x.label}</Ext>)}</span> });
  if (p.added) rows.push({ label: "On the list since", value: <time key="a" dateTime={p.added}>{new Date(p.added + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" })}</time> });
  if (appearedValue) rows.push({ label: "Appeared in", value: appearedValue, heading: true });
  rows.push({ label: "Sources", value: sourcesValue, heading: true }, { label: "Last checked", value: <time key="t" dateTime={checked}>{formatUpdated(checked)}</time> });

  const frozenLd = { "@context": "https://schema.org", "@type": "ProfilePage", url: abs(path), dateModified: p.updated || v.updated,
    mainEntity: { "@type": "Person", name: p.name, jobTitle: p.role, affiliation: { "@type": "Organization", name: p.org }, description: p.short, url: p.url || undefined, ...(p.workedWith?.length ? { colleague: p.workedWith.map((w) => ({ "@type": "Person", name: w.name, ...(w.url ? { url: w.url } : {}) })) } : {}), ...(p.location ? { homeLocation: { "@type": "Place", name: p.location } } : {}), sameAs: [...new Set([...(p.url ? [p.url] : []), ...(p.profiles || []).map((y) => y.url), ...p.sources])] } };

  const leadLabels = new Set(["Known for", "Why chosen", "Worked with"]);
  const leadRows = rows.filter((r) => leadLabels.has(r.label));
  const restRows = rows.filter((r) => !leadLabels.has(r.label));
  const frozenLead = frozenRows.filter(([k]) => leadLabels.has(k));
  const frozenRest = frozenRows.filter(([k]) => !leadLabels.has(k));

  const created = firstAppearance(p, appeared);
  const pageUrl = abs(path);
  const id = personId(path);
  const sameAs = personSameAs(p);
  const subjectOf = personSubjectOf(p);
  const ld = frozen ? frozenLd : {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: pageUrl,
    ...(created ? { dateCreated: created } : {}),
    dateModified: p.updated || v.updated,
    mainEntity: {
      "@type": "Person",
      "@id": id,
      name: p.name,
      jobTitle: p.role,
      worksFor: { "@type": "Organization", name: p.org },
      description: p.short,
      url: (p.url && sameAs.includes(p.url) ? p.url : undefined),
      ...(p.workedWith?.length ? { colleague: p.workedWith.map((w) => ({ "@type": "Person", name: w.name, ...(w.url ? { url: w.url } : {}) })) } : {}),
      ...(p.location ? { homeLocation: { "@type": "Place", name: p.location } } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      ...(subjectOf.length ? { subjectOf } : {}),
    },
  };
  const crumbs = frozen ? null : breadcrumbLd([
    { name: "Home", url: SITE_URL },
    { name: c.name, url: abs(vpath(v, c.slug)) },
    { name: p.name },
  ]);
  const others = frozen ? [] : c.people.filter((q) => q.name !== p.name);
  const posts = frozen ? [] : postsMentioningPath(path);
  const shareTitle = frozen ? `${p.name} – Ella` : personTitle(p);

  return <div className="pv-wrap wrap">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs ? [ld, crumbs] : ld) }} />
    <article className="pv">
      <div className="pv-share-top"><ShareButton url={abs(path)} title={shareTitle} /></div>
      <div className="pv-main">
        <p className="pv-kick"><Link href={vpath(v, c.slug)} className="pv-cat"><CatIcon slug={c.slug} />{c.name}</Link><span className="pv-mute pv-no">No. {String(rank).padStart(2, "0")} of {String(c.people.length).padStart(2, "0")}</span>{c.people.length > 1 && <PersonNav prev={nb(-1)} next={nb(1)} />}</p>
        <h1 className="pv-name">{p.name}</h1>
        {(media || badge) && <div className="pv-mslot pv-desk">{media}{badge}</div>}
      </div>
      <div className="pv-side">
        {frozen ? <FrozenFields rows={frozenLead} /> : <Fields rows={leadRows} />}
        {(media || badge) && <div className="pv-mslot pv-mob">{media}{badge}</div>}
        {frozen ? <FrozenFields rows={frozenRest} /> : <Fields rows={restRows} />}
      </div>
    </article>
    {!frozen && (others.length > 0 || posts.length > 0) && (
      <aside className="pv-more" aria-label="Related">
        {others.length > 0 && (
          <div className="pv-more-block">
            <h2>{`More in ${c.name}`}</h2>
            <ul>
              {others.map((q) => (
                <li key={q.name}>
                  <Link href={href(q.name)}>{q.name}</Link>
                  <span className="pv-more-meta">, {q.role}, {q.org}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {posts.length > 0 && (
          <div className="pv-more-block">
            <h2>From the blog</h2>
            <ul>
              {posts.map((post) => (
                <li key={post.slug}><Link href={`/blog/${post.slug}`}>{post.title}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    )}
    <nav className="pv-back"><Link href={vpath(v, c.slug)}>← All {c.name}</Link></nav>
  </div>;
}
