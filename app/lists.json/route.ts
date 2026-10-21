import { listsPayload } from "@/lib/lists";
export const dynamic = "force-static";
export function GET() {
  return new Response(JSON.stringify(listsPayload(), null, 2), { headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } });
}
