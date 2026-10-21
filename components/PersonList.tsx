import type { Category } from "@/lib/data";
import { host } from "@/lib/data";

export default function PersonList({ c, headingLevel = 3 }: { c: Category; headingLevel?: 2 | 3 }) {
  const H = (headingLevel === 2 ? "h2" : "h3") as "h2" | "h3";
  return (
    <ol className="people">
      {c.people.map((p, i) => (
        <li key={p.name} className="person" style={{ animationDelay: `${i * 60}ms` }}>
          <span className="rank" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          <article>
            <H className="p-name">{p.url ? <a href={p.url}>{p.name}</a> : p.name}
              {p.url && <span className="p-site">{host(p.url)}</span>}</H>
            <p className="p-role">{p.role}, <span>{p.org}</span></p>
            <p className="p-status">{p.status}{!p.verified && <span className="unverified" title={p.note || "Unverified"}> Unverified</span>}</p>
            <p className="p-source">{p.sources.map((s, j) => <a key={s} href={s} rel="noopener nofollow">{j === 0 ? "Source" : "Also"}: {host(s)}</a>)}
              {p.verified && p.note && <span className="p-note">{p.note}</span>}</p>
          </article>
        </li>
      ))}
    </ol>
  );
}
