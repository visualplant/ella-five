import { NextResponse } from "next/server";
import {
  buildSubscriberSession,
  getMergedVotes,
  parseCookieHeader,
  readSubCookie,
  readVotesCookie,
  signSubCookie,
  SUB_COOKIE,
  verifyClaimToken,
  VOTES_COOKIE,
} from "@/lib/rising";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const claimToken = u.searchParams.get("claim");
  const claimMember = claimToken ? verifyClaimToken(claimToken) : null;

  const cookieHeader = req.headers.get("cookie");
  let subscriber = readSubCookie(parseCookieHeader(cookieHeader, SUB_COOKIE));
  let setClaimCookie = false;

  if (claimMember) {
    subscriber = buildSubscriberSession(subscriber?.email || "", true, claimMember.slug, subscriber?.categories);
    setClaimCookie = true;
  }

  const votesCookie = readVotesCookie(parseCookieHeader(cookieHeader, VOTES_COOKIE));
  const votes = getMergedVotes(votesCookie);
  const myUpvotes =
    subscriber?.memberSlug && votesCookie?.m === subscriber.memberSlug
      ? votesCookie.u
      : subscriber?.memberSlug
        ? Object.entries(votes)
            .filter(([, v]) => v.upvoters.some((x) => x.slug === subscriber!.memberSlug))
            .map(([slug]) => slug)
        : [];

  const res = NextResponse.json({
    subscriber,
    votes,
    myUpvotes,
  });

  if (setClaimCookie && claimMember) {
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
  }

  return res;
}
