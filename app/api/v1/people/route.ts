import { apiJson, apiOptions, requireApiKey } from "@/lib/api-auth";
import { publicPeople } from "@/lib/public";

export const dynamic = "force-dynamic";

export function OPTIONS() { return apiOptions(); }

export function GET(req: Request) {
  const auth = requireApiKey(req);
  if (!auth.ok) return auth.response;
  const sp = new URL(req.url).searchParams;
  const body = publicPeople({ fields: sp.get("fields"), visibility: sp.get("visibility"), category: sp.get("category"), current: sp.get("current") });
  const status = "error" in body ? 400 : 200;
  return apiJson(body, { status, remaining: auth.remaining, reset: auth.reset });
}
