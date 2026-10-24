import { NextResponse } from "next/server";
import { enabled, verify, addContacts } from "@/lib/resend";
import {
  ALL_CAT_SLUGS,
  buildSubscriberSession,
  parseCookieHeader,
  readSubCookie,
  readVotesCookie,
  saveTip,
  signSubCookie,
  signVotesCookie,
  SUB_COOKIE,
  toggleRisingVote,
  VOTES_COOKIE,
} from "@/lib/rising";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const go = (s: string) => NextResponse.redirect(new URL(`/confirm?s=${s}`, u), 303);
  const p = verify(u.searchParams.get("token") || "", "confirm");
  if (!p) return go("invalid");

  if (enabled() && p.c?.length) {
    const ok = await addContacts(p.e, p.c);
    if (!ok && !p.vote && !p.tip && !p.next) return go("invalid");
  } else if (!enabled() && !p.vote && !p.tip && !p.next) {
    return go("unavailable");
  }

  const cookieHeader = req.headers.get("cookie");
  const existingSub = readSubCookie(parseCookieHeader(cookieHeader, SUB_COOKIE));
  const cats = p.c?.length ? p.c : existingSub?.categories?.length ? existingSub.categories : ALL_CAT_SLUGS;

  const subscriber = buildSubscriberSession(p.e, true, p.m || null, cats);
  const memberSlug = subscriber?.memberSlug || p.m || null;

  let destUrl = new URL("/confirm?s=ok", u);
  let updatedVotesCookie: string | null = null;

  if (p.next === "/rising-stars" || p.vote || p.tip) {
    const params = new URLSearchParams({ verified: "1" });
    let hash = "";

    if (p.vote && memberSlug) {
      const votesCookie = readVotesCookie(parseCookieHeader(cookieHeader, VOTES_COOKIE));
      const toggled = toggleRisingVote(p.vote, memberSlug, votesCookie);
      if (toggled) {
        if (!toggled.upvoted) {
          const reToggled = toggleRisingVote(p.vote, memberSlug, { m: memberSlug, u: toggled.memberUpvotedSlugs });
          if (reToggled) {
            updatedVotesCookie = signVotesCookie(memberSlug, reToggled.memberUpvotedSlugs);
          }
        } else {
          updatedVotesCookie = signVotesCookie(memberSlug, toggled.memberUpvotedSlugs);
        }
        params.set("voted", p.vote);
        hash = `#${p.vote}`;
      }
    }

    if (p.tip && memberSlug && subscriber?.memberName) {
      saveTip({
        name: p.tip.name,
        url: p.tip.url,
        category: p.tip.category,
        note: p.tip.note,
        submittedBy: {
          slug: memberSlug,
          name: subscriber.memberName,
        },
      });
      params.set("tipped", p.tip.name);
      hash = "#send-tip";
    }

    destUrl = new URL(`/rising-stars?${params.toString()}${hash}`, u);
  }

  const res = NextResponse.redirect(destUrl, 303);
  res.cookies.set(SUB_COOKIE, signSubCookie(p.e, true, memberSlug, cats), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 86400,
  });
  if (updatedVotesCookie) {
    res.cookies.set(VOTES_COOKIE, updatedVotesCookie, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 86400,
    });
  }
  return res;
}
