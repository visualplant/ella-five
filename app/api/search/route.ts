// Site search for the header autocomplete (no API key; the keyed developer API is /api/v1/search).
// Returns only public fields: id, name, href, secondary. Matching covers every public profile text field.
import { publicSearch } from "@/lib/public";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 100);
  const body = publicSearch(q);
  if ("error" in body) return Response.json({ results: [] }, { status: 400 });
  return Response.json({ results: body.results.slice(0, 20) }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
