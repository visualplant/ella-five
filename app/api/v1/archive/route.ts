import { apiJson, apiOptions, requireApiKey } from "@/lib/api-auth";
import { publicArchive } from "@/lib/public";

export const dynamic = "force-dynamic";

export function OPTIONS() { return apiOptions(); }

export function GET(req: Request) {
  const auth = requireApiKey(req);
  if (!auth.ok) return auth.response;
  return apiJson(publicArchive(), { remaining: auth.remaining, reset: auth.reset });
}
