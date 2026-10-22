import { verticals, vpath } from "@/lib/verticals";
import { abs, SITE, REPO, LICENSE_NOTE, formatUpdated } from "@/lib/data";
export function listsPayload() {
  return {
    name: "Ella – AI Talent Tracker", url: SITE + "/", about: SITE + "/about", schema: "Each vertical has five categories; each category is an ordered top five (position 1-5).",
    license: LICENSE_NOTE, source: REPO,
    updated: verticals.map((v) => v.updated).sort().at(-1),
    verticals: verticals.map((v) => ({ slug: v.slug, name: v.name, title: v.title, url: abs(vpath(v)) || SITE + "/", updated: v.updated,
      categories: v.categories.map((c) => ({ slug: c.slug, name: c.name, description: c.blurb, url: abs(vpath(v, c.slug)),
        people: c.people.map((p, i) => ({ position: i + 1, name: p.name, role: p.role, organization: p.org, summary: p.short, status: p.status, verified: p.verified, url: p.url, sources: p.sources })) })) })),
  };
}
export function listsMarkdown() {
  const out = ["# Ella – AI Talent Tracker: full lists", "", `> ${LICENSE_NOTE}`, "", `JSON: ${SITE}/lists.json · About: ${SITE}/about`, ""];
  for (const v of verticals) {
    out.push(`## ${v.title} (${abs(vpath(v)) || SITE + "/"})`, "", `Last updated ${formatUpdated(v.updated)} (${v.updated}).`, "");
    for (const c of v.categories) {
      out.push(`### ${c.name}`, "", `${c.blurb} Page: ${abs(vpath(v, c.slug))}`, "");
      c.people.forEach((p, i) => { out.push(`${i + 1}. **${p.name}**: ${p.role}, ${p.org}${p.url ? ` (${p.url})` : ""}`, `   - ${p.status}${p.verified ? "" : " [unverified]"}`, `   - Sources: ${p.sources.join(", ")}`, ...(p.workedWith?.length ? [`   - Worked with: ${p.workedWith.map((w) => [w.name, w.role, w.org].filter(Boolean).join(", ") + (w.relation ? ` (${w.relation})` : "") + (w.url ? ` <${w.url}>` : "")).join("; ")}`] : [])); });
      out.push("");
    }
  }
  return out.join("\n");
}
