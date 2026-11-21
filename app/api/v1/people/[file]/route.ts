import { apiJson, apiOptions, requireApiKey } from "@/lib/api-auth";
import { publicPerson } from "@/lib/public";
import { people } from "@/lib/people";

export const dynamic = "force-dynamic";

export function OPTIONS() { return apiOptions(); }

export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // Retired unauthenticated /api/v1/people/{slug}.json — do not fall through to the keyed handler.
  if (file.endsWith(".json")) return new Response("Not found", { status: 404 });
  const auth = requireApiKey(req);
  if (!auth.ok) return auth.response;
  const e = people().get(file);
  if (!e) return apiJson({ error: "Not found" }, { status: 404, remaining: auth.remaining, reset: auth.reset });
  return apiJson(publicPerson(e), { remaining: auth.remaining, reset: auth.reset });
}
