import { verticals, vpath } from "@/lib/verticals";
import { formatUpdated, abs } from "@/lib/data";
export const dynamic = "force-static";
export function GET() {
  const body = [`# Ella`, ``, `> Short, sourced lists of five notable people in each of five disciplines${verticals.length > 1 ? ", across several industries" : " in AI"}. Statuses describe public role changes, not availability.`, ``,
    ...verticals.flatMap((v) => [`# Ella – ${v.title} (${abs(vpath(v))})`, ``, `Last updated ${formatUpdated(v.updated)} (${v.updated}).`, ``,
      ...v.categories.flatMap((c) => [`## ${c.name}`, ``, `${c.blurb} Page: ${abs(vpath(v, c.slug))}`, ``,
        ...c.people.map((p, i) => `${i + 1}. ${p.name}${p.url ? ` (${p.url})` : ""}: ${p.role}, ${p.org}. ${p.status}${p.verified ? "" : " [unverified]"} Source: ${p.sources[0]}`), ``])]),
    `## About`, ``, `Built by Jason Schmidt (https://jsn.io), who also appears on the AI Design list.`].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
