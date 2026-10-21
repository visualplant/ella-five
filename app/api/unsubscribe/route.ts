import { NextResponse } from "next/server";
import { enabled, verify, unsubscribeContacts } from "@/lib/resend";
async function handle(req: Request) {
  const u = new URL(req.url); const go = (s: string) => NextResponse.redirect(new URL(`/unsubscribe?s=${s}`, u), 303);
  if (!enabled()) return go("unavailable");
  const p = verify(u.searchParams.get("token") || "", "unsubscribe"); if (!p) return go("invalid");
  const ok = await unsubscribeContacts(p.e, p.c);
  return req.method === "POST" ? new NextResponse(null, { status: ok ? 200 : 500 }) : go(ok ? "ok" : "invalid");
}
export const GET = handle;
export const POST = handle; // RFC 8058 one-click unsubscribe
