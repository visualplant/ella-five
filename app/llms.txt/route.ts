import { verticals, vpath } from "@/lib/verticals";
import { formatUpdated, abs, SITE } from "@/lib/data";
export const dynamic = "force-static";
export function GET() {
  const body = [`# Ella`, ``, `> Short, sourced lists of five notable people in each of five disciplines${verticals.length > 1 ? ", across several industries" : " in AI"}. Statuses describe public role changes, not availability.`, ``,
    `## Links`, ``, `- [About Ella](${SITE}/about): who Ella is and how picks are made`, `- [lists.json](${SITE}/lists.json): all current lists as JSON (CORS open)`, `- [llms-full.txt](${SITE}/llms-full.txt): full lists with statuses and every source, in markdown`, `- [Subscribe](${SITE}/subscribe): email updates per category`, ``,
    ...verticals.flatMap((v) => [`# Ella – ${v.title} (${abs(vpath(v))})`, ``, `Last updated ${formatUpdated(v.updated)} (${v.updated}).`, ``,
      ...v.categories.flatMap((c) => [`## ${c.name}`, ``, `${c.blurb} Page: ${abs(vpath(v, c.slug))}`, ``,
        ...c.people.map((p, i) => `${i + 1}. ${p.name}${p.url ? ` (${p.url})` : ""}: ${p.role}, ${p.org}${p.location ? ` (${p.location})` : ""}. ${p.status}${p.workedWith?.length ? ` Worked with: ${p.workedWith.map((w) => [w.name, w.role, w.org].filter(Boolean).join(", ") + (w.relation ? ` (${w.relation})` : "")).join("; ")}.` : ""}${p.verified ? "" : " [unverified]"} Source: ${p.sources[0]}`), ``])])].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
