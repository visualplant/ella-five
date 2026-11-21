import { apiJson, apiOptions, requireApiKey } from "@/lib/api-auth";
import { publicWeek } from "@/lib/public";

export const dynamic = "force-dynamic";

export function OPTIONS() { return apiOptions(); }

export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  const auth = requireApiKey(req);
  if (!auth.ok) return auth.response;
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return apiJson({ error: "Not found" }, { status: 404, remaining: auth.remaining, reset: auth.reset });
  const week = publicWeek(date);
  if (!week) return apiJson({ error: "Not found" }, { status: 404, remaining: auth.remaining, reset: auth.reset });
  return apiJson(week, { remaining: auth.remaining, reset: auth.reset });
}
