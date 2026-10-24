import { NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { sendRisingVerify } from "@/lib/resend";
import {
  buildSubscriberSession,
  isValidEmail,
  parseCookieHeader,
  readSubCookie,
  saveTip,
  signSubCookie,
  SUB_COOKIE,
  verifyClaimToken,
} from "@/lib/rising";

const validCats = new Set(categories.map((c) => c.slug));

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const cookieHeader = req.headers.get("cookie");

  const existingSub = readSubCookie(parseCookieHeader(cookieHeader, SUB_COOKIE));
  const claimMember = typeof b?.claim === "string" && b.claim ? verifyClaimToken(b.claim) : null;
  const incomingEmail = typeof b?.email === "string" ? b.email.trim().toLowerCase() : "";
  const isSameVerifiedEmail = Boolean(
    incomingEmail && existingSub?.email && incomingEmail === existingSub.email && existingSub.verified,
  );
  const allowClaimedSlug = Boolean(
    claimMember || (!incomingEmail && existingSub?.claimedSlug) || (incomingEmail && existingSub && (!existingSub.email || incomingEmail === existingSub.email)),
  );
  const claimedSlug = claimMember?.slug || (allowClaimedSlug ? existingSub?.claimedSlug : null) || null;
  const cats = existingSub?.categories;

  let subscriber = existingSub;
  let setNewSubCookie = false;

  if (incomingEmail) {
    if (!isValidEmail(incomingEmail)) {
      return NextResponse.json({ code: "INVALID_EMAIL", message: "Please enter a valid email address." }, { status: 400 });
    }
    const verifiedFlag = Boolean(claimMember) || isSameVerifiedEmail || Boolean(!existingSub?.email && existingSub?.verified && existingSub?.claimedSlug);
    subscriber = buildSubscriberSession(incomingEmail, verifiedFlag, claimedSlug, cats);
    setNewSubCookie = true;
  } else if (claimMember && (!subscriber || subscriber.memberSlug !== claimMember.slug || !subscriber.verified)) {
    subscriber = buildSubscriberSession(subscriber?.email || "", true, claimMember.slug, cats);
    setNewSubCookie = true;
  }

  const attachSub = (res: NextResponse) => {
    if (setNewSubCookie && subscriber) {
      res.cookies.set(
        SUB_COOKIE,
        signSubCookie(subscriber.email, subscriber.verified, claimedSlug || (subscriber.verified ? subscriber.memberSlug : null), subscriber.categories),
        {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 365 * 86400,
        },
      );
    }
    return res;
  };

  if (!subscriber) {
    return NextResponse.json(
      { code: "NEEDS_EMAIL", message: "Enter your email to send a tip to Ella." },
      { status: 401 },
    );
  }

  if (!subscriber.isListMember || !subscriber.memberSlug || !subscriber.memberName) {
    return attachSub(
      NextResponse.json(
        {
          code: "NOT_ON_LIST",
          message: "Only those who made the list can send a person tip to Ella.",
          subscriber,
        },
        { status: 403 },
      ),
    );
  }

  const name = typeof b?.name === "string" ? b.name.trim() : "";
  if (!name || name.length > 120) {
    return attachSub(
      NextResponse.json({ code: "INVALID_NAME", message: "Please enter the person’s name." }, { status: 400 }),
    );
  }

  let url: string | null = typeof b?.url === "string" && b.url.trim() ? b.url.trim() : null;
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  const category = typeof b?.category === "string" && validCats.has(b.category) ? b.category : null;
  const note = typeof b?.note === "string" && b.note.trim() ? b.note.trim().slice(0, 1000) : null;

  if (!subscriber.verified) {
    const allSlugs = subscriber.categories?.length ? subscriber.categories : categories.map((c) => c.slug);
    const origin = new URL(req.url).origin;
    await sendRisingVerify({
      email: subscriber.email,
      memberSlug: subscriber.memberSlug,
      memberName: subscriber.memberName,
      cats: allSlugs,
      tip: { name, url, category, note },
      origin,
    }).catch(() => {});

    return attachSub(
      NextResponse.json(
        {
          code: "NEEDS_VERIFICATION",
          message: `Check your inbox (${subscriber.email}) for a one-click link to confirm your email and send your tip (${name}) to Ella.`,
          subscriber,
        },
        { status: 202 },
      ),
    );
  }

  const tip = saveTip({
    name,
    url,
    category,
    note,
    submittedBy: {
      slug: subscriber.memberSlug,
      name: subscriber.memberName,
    },
  });

  return attachSub(
    NextResponse.json({
      ok: true,
      message: `Thank you, ${subscriber.memberName}. Ella will look into ${name}.`,
      tip,
      subscriber,
    }),
  );
}
