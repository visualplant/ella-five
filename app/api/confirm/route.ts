import { NextResponse } from "next/server";
import { enabled, verify, addContacts } from "@/lib/resend";
export async function GET(req: Request) {
  const u = new URL(req.url); const go = (s: string) => NextResponse.redirect(new URL(`/confirm?s=${s}`, u), 303);
  if (!enabled()) return go("unavailable");
  const p = verify(u.searchParams.get("token") || "", "confirm"); if (!p) return go("invalid");
  return go((await addContacts(p.e, p.c)) ? "ok" : "invalid");
}
