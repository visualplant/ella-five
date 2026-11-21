import type { Category } from "@/lib/data";
import { host } from "@/lib/data";
import { dedupeSourcesByHost } from "@/lib/sources";
import Link from "next/link";
import { ppath, type Vertical } from "@/lib/verticals";

export default function PersonList({ c, v, headingLevel = 3 }: { c: Category; v?: Vertical; headingLevel?: 2 | 3 }) {
  const H = (headingLevel === 2 ? "h2" : "h3") as "h2" | "h3";
  return (
    <ol className="people">
      {c.people.map((p, i) => {
        const sources = dedupeSourcesByHost(p.sources);
        return (
        <li key={p.name} className="person" style={{ animationDelay: `${i * 60}ms` }}>
          <span className="rank" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          <article>
            <H className="p-name">{v ? <Link href={ppath(v, c.slug, p.name)}>{p.name}</Link> : p.url ? <a href={p.url}>{p.name}</a> : p.name}
              {p.url && <span className="p-site">{host(p.url)}</span>}</H>
            <p className="p-role">{p.role}, <span>{p.org}</span></p>
            <p className="p-status">{p.status}</p>
            <p className="p-source">
              {sources[0] && <a href={sources[0]} rel="noopener nofollow">Source: {host(sources[0])}</a>}
              {sources.length > 1 && (
                <span className="p-also">
                  <span className="p-also-label">Also:</span>
                  <span className="p-also-links">{sources.slice(1).map((s) => <a key={s} href={s} rel="noopener nofollow">{host(s)}</a>)}</span>
                </span>
              )}
              {p.verified && p.note?.trim() && <span className="p-note">{p.note.trim()}</span>}
            </p>
          </article>
        </li>
        );
      })}
    </ol>
  );
}
