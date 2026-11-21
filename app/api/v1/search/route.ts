import { apiJson, apiOptions, requireApiKey } from "@/lib/api-auth";
import { publicSearch } from "@/lib/public";

export const dynamic = "force-dynamic";

export function OPTIONS() { return apiOptions(); }

export function GET(req: Request) {
  const auth = requireApiKey(req);
  if (!auth.ok) return auth.response;
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const body = publicSearch(q);
  if ("error" in body) return apiJson(body, { status: 400, remaining: auth.remaining, reset: auth.reset });
  return apiJson(body, { remaining: auth.remaining, reset: auth.reset });
}
