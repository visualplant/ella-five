import { NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { enabled, sendConfirm } from "@/lib/resend";
import {
  buildSubscriberSession,
  parseCookieHeader,
  readSubCookie,
  signSubCookie,
  SUB_COOKIE,
  verifyClaimToken,
} from "@/lib/rising";

const valid = new Set(categories.map((c) => c.slug));

export async function GET(req: Request) {
  const u = new URL(req.url);
  const claimToken = u.searchParams.get("claim");
  const claimMember = claimToken ? verifyClaimToken(claimToken) : null;
  const cookieHeader = req.headers.get("cookie");
  let subscriber = readSubCookie(parseCookieHeader(cookieHeader, SUB_COOKIE));

  if (claimMember && (!subscriber || subscriber.memberSlug !== claimMember.slug || !subscriber.verified)) {
    subscriber = buildSubscriberSession(subscriber?.email || "", true, claimMember.slug, subscriber?.categories);
    const res = NextResponse.json({ subscriber });
    res.cookies.set(
      SUB_COOKIE,
      signSubCookie(subscriber?.email || "", true, claimMember.slug, subscriber?.categories),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 365 * 86400,
      },
    );
    return res;
  }

  return NextResponse.json({ subscriber });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const email = String(b?.email || "").trim().toLowerCase();
  const cats: string[] = Array.isArray(b?.categories) ? [...new Set<string>(b.categories)].filter((c) => valid.has(c)) : [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  if (!cats.length) return NextResponse.json({ message: "Choose at least one list." }, { status: 400 });

  const cookieHeader = req.headers.get("cookie");
  const existingSub = readSubCookie(parseCookieHeader(cookieHeader, SUB_COOKIE));
  const claimMember = typeof b?.claim === "string" && b.claim ? verifyClaimToken(b.claim) : null;
  const isSameVerified = Boolean(existingSub?.email && existingSub.email === email && existingSub.verified);
  const claimedSlug = claimMember?.slug || (existingSub && (!existingSub.email || existingSub.email === email) ? existingSub.claimedSlug : null) || null;
  const verifiedFlag = Boolean(claimMember) || isSameVerified || Boolean(!existingSub?.email && existingSub?.verified && existingSub?.claimedSlug);

  // Merge newly chosen categories with any existing subscribed categories unless replaceCategories is true
  const mergedCats = b?.replaceCategories
    ? cats
    : existingSub?.email === email && existingSub.categories?.length
      ? [...new Set([...existingSub.categories, ...cats])]
      : cats;

  const subscriber = buildSubscriberSession(email, verifiedFlag, claimedSlug, mergedCats);
  const attach = (res: NextResponse) => {
    res.cookies.set(
      SUB_COOKIE,
      signSubCookie(email, verifiedFlag, claimedSlug || (verifiedFlag ? subscriber?.memberSlug : null), subscriber?.categories),
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 365 * 86400,
      },
    );
    return res;
  };

  if (!enabled()) {
    return attach(NextResponse.json({ message: "Thank you. Your subscription preferences have been saved.", subscriber }));
  }
  const names = categories.filter((c) => mergedCats.includes(c.slug)).map((c) => c.name).join(", ");
  const ok = await sendConfirm(email, mergedCats, names);
  return ok
    ? attach(NextResponse.json({ message: "Thank you. Check your inbox to confirm.", subscriber }))
    : attach(NextResponse.json({ message: "Something went wrong. Please try again.", subscriber }, { status: 502 }));
}
