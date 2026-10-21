import { listsMarkdown } from "@/lib/lists";
export const dynamic = "force-static";
export function GET() {
  return new Response(listsMarkdown(), { headers: { "content-type": "text/markdown; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300, s-maxage=3600" } });
}
