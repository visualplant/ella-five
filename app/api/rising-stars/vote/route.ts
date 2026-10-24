import { NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { sendRisingVerify } from "@/lib/resend";
import {
  buildSubscriberSession,
  getMergedVotes,
  isValidEmail,
  loadRising,
  parseCookieHeader,
  readSubCookie,
  readVotesCookie,
  signSubCookie,
  signVotesCookie,
  SUB_COOKIE,
  toggleRisingVote,
  verifyClaimToken,
  VOTES_COOKIE,
} from "@/lib/rising";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const cookieHeader = req.headers.get("cookie");

  if (b?.action === "clear") {
    const res = NextResponse.json({ ok: true, subscriber: null });
    res.cookies.delete(SUB_COOKIE);
    return res;
  }

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
      { code: "NEEDS_EMAIL", message: "Enter your email to subscribe and upvote." },
      { status: 401 },
    );
  }

  if (!subscriber.isListMember || !subscriber.memberSlug || !subscriber.memberName) {
    return attachSub(
      NextResponse.json(
        {
          code: "NOT_ON_LIST",
          message: "Only those who made the list can upvote rising stars.",
          subscriber,
        },
        { status: 403 },
      ),
    );
  }

  const votesCookie = readVotesCookie(parseCookieHeader(cookieHeader, VOTES_COOKIE));
  const targetSlug = typeof b?.targetSlug === "string" ? b.targetSlug.trim() : "";

  if (!targetSlug) {
    const votes = getMergedVotes(votesCookie);
    return attachSub(
      NextResponse.json({
        ok: true,
        subscriber,
        votes,
        myUpvotes: subscriber.verified
          ? Object.entries(votes)
              .filter(([, v]) => v.upvoters.some((u) => u.slug === subscriber!.memberSlug))
              .map(([slug]) => slug)
          : [],
      }),
    );
  }

  const risingData = loadRising();
  const targetPerson = risingData.people.find((p) => p.slug === targetSlug);
  if (!targetPerson) {
    return attachSub(NextResponse.json({ code: "NOT_FOUND", message: "Person not found." }, { status: 404 }));
  }

  if (!subscriber.verified) {
    const allSlugs = subscriber.categories?.length ? subscriber.categories : categories.map((c) => c.slug);
    const origin = new URL(req.url).origin;
    await sendRisingVerify({
      email: subscriber.email,
      memberSlug: subscriber.memberSlug,
      memberName: subscriber.memberName,
      cats: allSlugs,
      vote: { targetSlug, targetName: targetPerson.name },
      origin,
    }).catch(() => {});

    return attachSub(
      NextResponse.json(
        {
          code: "NEEDS_VERIFICATION",
          message: `Check your inbox (${subscriber.email}) for a one-click link to confirm your email and count your upvote for ${targetPerson.name}.`,
          subscriber,
        },
        { status: 202 },
      ),
    );
  }

  const toggled = toggleRisingVote(targetSlug, subscriber.memberSlug, votesCookie);
  if (!toggled) {
    return attachSub(NextResponse.json({ code: "NOT_FOUND", message: "Person not found." }, { status: 404 }));
  }

  const res = attachSub(
    NextResponse.json({
      ok: true,
      upvoted: toggled.upvoted,
      myUpvotes: toggled.memberUpvotedSlugs,
      votes: toggled.allVotes,
      subscriber,
    }),
  );
  res.cookies.set(VOTES_COOKIE, signVotesCookie(subscriber.memberSlug, toggled.memberUpvotedSlugs), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 86400,
  });
  return res;
}
