import { NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { addContacts, enabled, unsubscribeContacts, verify } from "@/lib/resend";
import {
  ALL_CAT_SLUGS,
  buildSubscriberSession,
  parseCookieHeader,
  readSubCookie,
  signSubCookie,
  SUB_COOKIE,
} from "@/lib/rising";

const valid = new Set(ALL_CAT_SLUGS);

export async function GET(req: Request) {
  const u = new URL(req.url);
  const token = u.searchParams.get("token") || "";
  const inspect = u.searchParams.get("inspect") === "1";

  const p = token ? verify(token, "unsubscribe") : null;
  const cookieHeader = req.headers.get("cookie");
  const existing = readSubCookie(parseCookieHeader(cookieHeader, SUB_COOKIE));

  if (inspect) {
    if (p) {
      const sub = buildSubscriberSession(
        p.e,
        true,
        existing?.email === p.e ? existing.claimedSlug : null,
        existing?.email === p.e ? existing.categories : p.c,
      );
      const res = NextResponse.json({ subscriber: sub, fromToken: true });
      if (sub) {
        res.cookies.set(SUB_COOKIE, signSubCookie(sub.email, true, sub.memberSlug, sub.categories), {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 365 * 86400,
        });
      }
      return res;
    }
    return NextResponse.json({ subscriber: existing, fromToken: false });
  }

  // Browser navigation to /api/unsubscribe?token=... redirects to the dedicated /unsubscribe?token=... page
  if (token) {
    return NextResponse.redirect(new URL(`/unsubscribe?token=${encodeURIComponent(token)}`, u), 303);
  }
  return NextResponse.redirect(new URL("/unsubscribe", u), 303);
}

export async function POST(req: Request) {
  const u = new URL(req.url);
  const queryToken = u.searchParams.get("token") || "";
  const contentType = req.headers.get("content-type") || "";

  // RFC 8058 one-click List-Unsubscribe-Post from email clients
  if (!contentType.includes("application/json") && queryToken) {
    const p = verify(queryToken, "unsubscribe");
    if (!p) return new NextResponse(null, { status: 400 });
    const ok = enabled() ? await unsubscribeContacts(p.e, p.c) : true;
    return new NextResponse(null, { status: ok ? 200 : 500 });
  }

  const b = await req.json().catch(() => ({}));
  const cookieHeader = req.headers.get("cookie");
  const existing = readSubCookie(parseCookieHeader(cookieHeader, SUB_COOKIE));
  const tokenPayload = typeof b?.token === "string" && b.token ? verify(b.token, "unsubscribe") : queryToken ? verify(queryToken, "unsubscribe") : null;

  const email = (tokenPayload?.e || existing?.email || String(b?.email || "")).trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "No active subscription found for this browser." }, { status: 400 });
  }

  const verifiedFlag = Boolean(tokenPayload) || Boolean(existing?.email === email && existing.verified);
  const claimedSlug = existing?.email === email ? existing.claimedSlug : null;

  // Determine desired categories after update/unsubscribe/resubscribe
  const desiredCats: string[] = Array.isArray(b?.categories)
    ? ALL_CAT_SLUGS.filter((c) => b.categories.includes(c) && valid.has(c))
    : [];

  if (enabled()) {
    const toRemove = ALL_CAT_SLUGS.filter((c) => !desiredCats.includes(c));
    if (toRemove.length) await unsubscribeContacts(email, toRemove).catch(() => {});
    if (desiredCats.length) await addContacts(email, desiredCats).catch(() => {});
  }

  const updated = buildSubscriberSession(email, verifiedFlag, claimedSlug, desiredCats);
  const names = categories.filter((c) => desiredCats.includes(c.slug)).map((c) => c.name).join(", ");
  const message =
    desiredCats.length === 0
      ? `You have been unsubscribed (${email}). You can re-subscribe below any time.`
      : `Your subscription for ${email} has been updated (${names}).`;

  const res = NextResponse.json({
    ok: true,
    subscriber: updated,
    message,
  });
  res.cookies.set(
    SUB_COOKIE,
    signSubCookie(email, verifiedFlag, claimedSlug || (verifiedFlag ? updated?.memberSlug : null), desiredCats),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 86400,
    },
  );
  return res;
}
