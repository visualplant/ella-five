import fs from "node:fs";
import path from "node:path";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { people, type Entry } from "@/lib/people";
import { pslug } from "@/lib/verticals";
import { categories, host } from "@/lib/data";

export type RisingPerson = {
  slug: string;
  name: string;
  category: string;
  url: string | null;
  role: string;
  org: string;
  status: string;
  short: string;
  signal?: string;
  tag?: string;
  sources: string[];
  added?: string;
  upvotes: number;
  upvoters: string[];
};

export type RisingData = {
  updated: string;
  blurb: string;
  people: RisingPerson[];
};

export type ListMemberIdentity = {
  slug: string;
  name: string;
  category: string;
  profilePath: string;
};

export type SubscriberSession = {
  email: string;
  verified: boolean;
  isListMember: boolean;
  memberSlug: string | null;
  memberName: string | null;
  profilePath: string | null;
  categories: string[];
  gravatarHash: string | null;
};

export type Endorser = {
  slug: string;
  name: string;
  profilePath: string;
};

export type PersonTip = {
  id: string;
  createdAt: string;
  name: string;
  url: string | null;
  category: string | null;
  note: string | null;
  submittedBy: {
    slug: string;
    name: string;
  };
};

// SERVER-ONLY paths — never imported by client bundles or rendered on person pages.
const RISING_FILE = path.join(process.cwd(), "content", "rising-stars.json");
const MEMBERS_FILE = path.join(process.cwd(), "content", "list-members.json");
const TMP_VOTES_FILE = "/tmp/ella-rising-votes.json";
const TMP_TIPS_FILE = "/tmp/ella-rising-tips.json";
const TMP_CLAIMED_EMAILS_FILE = "/tmp/ella-claimed-emails.json";

export const SUB_COOKIE = "ella_sub";
export const VOTES_COOKIE = "ella_votes";
export const ALL_CAT_SLUGS = categories.map((c) => c.slug);

const SHARED_HOSTS = new Set([
  "linkedin.com",
  "x.com",
  "twitter.com",
  "github.com",
  "substack.com",
  "medium.com",
  "youtube.com",
  "youtu.be",
  "framer.website",
  "notion.site",
  "podcasts.apple.com",
  "beehiiv.com",
  "stanford.edu",
  "mit.edu",
]);

const ORG_DOMAINS: Record<string, string[]> = {
  openai: ["openai.com"],
  anthropic: ["anthropic.com"],
  "google deepmind": ["google.com", "deepmind.com"],
  google: ["google.com"],
  mirendil: ["mirendil.ai", "mirendil.com"],
  "discovery loop": ["discoveryloop.ai", "discoveryloop.com"],
  embo: ["embo.ai", "embo.com"],
  "metis reasoning": ["metisreasoning.ai", "metis.ai"],
  perplexity: ["perplexity.ai"],
  lovable: ["lovable.dev"],
  "mistral ai": ["mistral.ai"],
  "isomorphic labs": ["isomorphiclabs.com"],
  metr: ["metr.org"],
  "worktrace ai": ["worktrace.ai"],
  mastercard: ["mastercard.com"],
  harvey: ["harvey.ai"],
  pinterest: ["pinterest.com"],
  spacex: ["spacex.com"],
  spacexai: ["x.ai", "spacex.com"],
  vercel: ["vercel.com"],
  base: ["base.org", "coinbase.com"],
  "thrive capital": ["thrivecap.com"],
  energy: ["energy.ai"],
  humana: ["humana.com"],
  "xbox (microsoft)": ["microsoft.com", "xbox.com"],
};

export function loadRising(): RisingData {
  const raw = JSON.parse(fs.readFileSync(RISING_FILE, "utf8")) as RisingData;
  return raw;
}

type MembersConfig = {
  members?: Record<string, { domains?: string[]; emails?: string[] }>;
};

function loadMembersConfig(): Record<string, { domains?: string[]; emails?: string[] }> {
  try {
    const raw = JSON.parse(fs.readFileSync(MEMBERS_FILE, "utf8")) as MembersConfig;
    return raw.members || {};
  } catch {
    return {};
  }
}

function readClaimedEmails(): Record<string, string> {
  try {
    if (!fs.existsSync(TMP_CLAIMED_EMAILS_FILE)) return {};
    return JSON.parse(fs.readFileSync(TMP_CLAIMED_EMAILS_FILE, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

export function bindClaimedEmail(email: string, memberSlug: string): void {
  const clean = email.trim().toLowerCase();
  if (!isValidEmail(clean) || !people().has(memberSlug)) return;
  const map = readClaimedEmails();
  map[clean] = memberSlug;
  try {
    fs.writeFileSync(TMP_CLAIMED_EMAILS_FILE, JSON.stringify(map, null, 2));
  } catch {
    // ignore read-only fs errors
  }
}

export function isValidEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

export function gravatarHashFor(email: string): string | null {
  const clean = email.trim().toLowerCase();
  if (!clean) return null;
  return createHash("sha256").update(clean).digest("hex");
}

const cleanToken = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

function toIdentity(e: Entry): ListMemberIdentity {
  return {
    slug: e.slug,
    name: e.p.name,
    category: e.home,
    profilePath: `/${e.home}/${e.slug}`,
  };
}

export function getMemberBySlug(slug: string | null | undefined): ListMemberIdentity | null {
  if (!slug) return null;
  const entry = people().get(slug);
  return entry ? toIdentity(entry) : null;
}

/**
 * Matches a valid email address against anyone who has made Ella's 5x5 list
 * (current ai.json + archived weekly lists in data/weekly/) or Ella's founder.
 * Email comparisons happen strictly on the server; no member emails are ever exposed.
 */
export function matchListMemberByEmail(rawEmail: string, claimedSlug?: string | null): ListMemberIdentity | null {
  if (claimedSlug) {
    const claimed = getMemberBySlug(claimedSlug);
    if (claimed) return claimed;
  }

  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) return null;
  const [localRaw, domainRaw] = email.split("@");
  if (!localRaw || !domainRaw) return null;
  const local = localRaw.split("+")[0];
  const domain = domainRaw.replace(/^www\./, "");
  const canonicalEmail = `${local}@${domain}`;

  const allPeople = people();

  // 0. Check runtime claimed email bindings (from ?claim= links)
  const claimedMap = readClaimedEmails();
  const boundSlug = claimedMap[email] || claimedMap[canonicalEmail];
  if (boundSlug && allPeople.has(boundSlug)) {
    return toIdentity(allPeople.get(boundSlug)!);
  }

  const cfg = loadMembersConfig();

  // 1. Check explicit emails and personal domains in server-only content/list-members.json
  for (const [slug, rule] of Object.entries(cfg)) {
    const entry = allPeople.get(slug);
    if (!entry) continue;
    const emails = (rule.emails || []).map((x) => x.toLowerCase());
    if (emails.includes(email) || emails.includes(canonicalEmail)) {
      return toIdentity(entry);
    }
    const domains = (rule.domains || [])
      .map((d) => d.toLowerCase().replace(/^www\./, ""))
      .filter((d) => !SHARED_HOSTS.has(d));
    if (domains.includes(domain)) {
      return toIdentity(entry);
    }
  }

  // 2. Check each person in people() (current + weekly archives) by personal site domain or name+org domain
  for (const entry of allPeople.values()) {
    const p = entry.p;

    if (p.url) {
      try {
        const h = host(p.url).toLowerCase();
        if (h && !SHARED_HOSTS.has(h) && (domain === h || domain.endsWith(`.${h}`))) {
          return toIdentity(entry);
        }
      } catch {
        // ignore invalid url
      }
    }

    const parts = p.name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);

    const localClean = cleanToken(local);
    const fullClean = parts.join("");

    if (parts.length >= 2 && fullClean.length >= 6 && localClean === fullClean) {
      return toIdentity(entry);
    }

    const orgKey = p.org.toLowerCase().replace(/\s*\(former\)\s*/g, "").trim();
    const orgDomains = ORG_DOMAINS[orgKey] || [];
    if (orgDomains.includes(domain) && parts.length >= 1) {
      const first = parts[0];
      const last = parts[parts.length - 1];
      if (
        localClean === first ||
        localClean === last ||
        localClean === `${first[0]}${last}` ||
        localClean === `${first}${last[0]}`
      ) {
        return toIdentity(entry);
      }
    }
  }

  return null;
}

export function normalizeCats(cats?: string[] | null): string[] {
  if (!Array.isArray(cats)) return [...ALL_CAT_SLUGS];
  const valid = new Set(ALL_CAT_SLUGS);
  return ALL_CAT_SLUGS.filter((c) => cats.includes(c) && valid.has(c));
}

export function buildSubscriberSession(
  rawEmail: string,
  verified = false,
  claimedSlug?: string | null,
  cats?: string[] | null,
): SubscriberSession | null {
  const clean = rawEmail.trim().toLowerCase();
  const normalizedCats = normalizeCats(cats);
  if (!clean && claimedSlug) {
    const m = getMemberBySlug(claimedSlug);
    if (!m) return null;
    // If claimed member has a primary public email in list-members.json, keep session email blank unless known, or use their slug
    return {
      email: "",
      verified,
      isListMember: true,
      memberSlug: m.slug,
      memberName: m.name,
      profilePath: m.profilePath,
      categories: normalizedCats,
      gravatarHash: null,
    };
  }
  if (!isValidEmail(clean)) return null;
  if (claimedSlug) bindClaimedEmail(clean, claimedSlug);
  const m = matchListMemberByEmail(clean, claimedSlug);
  return {
    email: clean,
    verified,
    isListMember: Boolean(m),
    memberSlug: m?.slug ?? null,
    memberName: m?.name ?? null,
    profilePath: m?.profilePath ?? null,
    categories: normalizedCats,
    gravatarHash: gravatarHashFor(clean),
  };
}

// HMAC signing for subscriber identity cookie, vote state cookie, and ?claim= tokens
const secret = () => process.env.SUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "ella-rising-stars-cookie-key";
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const hmac = (s: string) => createHmac("sha256", secret()).update(s).digest("base64url");

function signToken(payload: unknown): string {
  const body = b64(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

function verifyToken<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const [body, s] = token.split(".");
  if (!body || !s) return null;
  const a = Buffer.from(hmac(body));
  const b = Buffer.from(s);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

type SubCookiePayload = { e: string; v?: boolean; c?: string; cats?: string[]; t: number };
type VotesCookiePayload = { m: string; u: string[] };
type ClaimTokenPayload = { a: "claim"; m: string };

/**
 * Signs a permanent claim token for a 5x5 list member slug so Ella can share
 * `/rising-stars?claim=<token>` or `/subscribe?claim=<token>` in outreach.
 */
export function signClaimToken(memberSlug: string): string {
  return signToken({ a: "claim", m: memberSlug } satisfies ClaimTokenPayload);
}

export function verifyClaimToken(token: string | undefined | null): ListMemberIdentity | null {
  const p = verifyToken<ClaimTokenPayload>(token);
  if (!p || p.a !== "claim" || typeof p.m !== "string") return null;
  return getMemberBySlug(p.m);
}

export function signSubCookie(
  email: string,
  verified = false,
  claimedSlug?: string | null,
  cats?: string[] | null,
): string {
  return signToken({
    e: email.trim().toLowerCase(),
    v: verified,
    ...(claimedSlug ? { c: claimedSlug } : {}),
    cats: normalizeCats(cats),
    t: Date.now(),
  } satisfies SubCookiePayload);
}

export function readSubCookie(token: string | undefined | null): (SubscriberSession & { claimedSlug?: string | null }) | null {
  const p = verifyToken<SubCookiePayload>(token);
  if (!p) return null;
  const sess = buildSubscriberSession(p.e || "", Boolean(p.v), p.c || null, p.cats);
  return sess ? { ...sess, claimedSlug: p.c || sess.memberSlug } : null;
}

export function signVotesCookie(memberSlug: string, upvotedSlugs: string[]): string {
  return signToken({ m: memberSlug, u: [...new Set(upvotedSlugs)] } satisfies VotesCookiePayload);
}

export function readVotesCookie(token: string | undefined | null): VotesCookiePayload | null {
  const p = verifyToken<VotesCookiePayload>(token);
  if (!p || typeof p.m !== "string" || !Array.isArray(p.u)) return null;
  return { m: p.m, u: p.u.filter((x) => typeof x === "string") };
}

export function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

// Vote store: merges base JSON + /tmp/ella-rising-votes.json + caller's signed votes cookie
type VoteMap = Record<string, string[]>;

function readTmpVotes(): VoteMap {
  try {
    if (!fs.existsSync(TMP_VOTES_FILE)) return {};
    return JSON.parse(fs.readFileSync(TMP_VOTES_FILE, "utf8")) as VoteMap;
  } catch {
    return {};
  }
}

function writeTmpVotes(v: VoteMap): void {
  try {
    fs.writeFileSync(TMP_VOTES_FILE, JSON.stringify(v, null, 2));
  } catch {
    // ignore read-only fs errors
  }
}

export function getMergedVotes(cookieVotes?: VotesCookiePayload | null): Record<
  string,
  { count: number; upvoters: Endorser[] }
> {
  const data = loadRising();
  const tmp = readTmpVotes();
  const allPeople = people();
  const out: Record<string, { count: number; upvoters: Endorser[] }> = {};

  for (const item of data.people) {
    const set = new Set<string>([...(item.upvoters || []), ...(tmp[item.slug] || [])]);
    if (cookieVotes && cookieVotes.m) {
      if (cookieVotes.u.includes(item.slug)) set.add(cookieVotes.m);
      else set.delete(cookieVotes.m);
    }
    const upvoters: Endorser[] = [];
    for (const memberSlug of set) {
      const e = allPeople.get(memberSlug);
      if (e) {
        upvoters.push({ slug: e.slug, name: e.p.name, profilePath: `/${e.home}/${e.slug}` });
      }
    }
    out[item.slug] = {
      count: Math.max(item.upvotes || 0, upvoters.length),
      upvoters,
    };
  }
  return out;
}

export function toggleRisingVote(
  targetSlug: string,
  memberSlug: string,
  cookieVotes?: VotesCookiePayload | null,
): { upvoted: boolean; memberUpvotedSlugs: string[]; allVotes: Record<string, { count: number; upvoters: Endorser[] }> } | null {
  const data = loadRising();
  const target = data.people.find((p) => p.slug === targetSlug);
  if (!target) return null;

  const tmp = readTmpVotes();
  if (cookieVotes && cookieVotes.m === memberSlug) {
    for (const p of data.people) {
      const cur = new Set<string>([...(p.upvoters || []), ...(tmp[p.slug] || [])]);
      if (cookieVotes.u.includes(p.slug)) cur.add(memberSlug);
      tmp[p.slug] = [...cur];
    }
  }

  const currentSet = new Set<string>([...(target.upvoters || []), ...(tmp[targetSlug] || [])]);
  let upvoted: boolean;
  if (currentSet.has(memberSlug)) {
    currentSet.delete(memberSlug);
    upvoted = false;
  } else {
    currentSet.add(memberSlug);
    upvoted = true;
  }
  tmp[targetSlug] = [...currentSet];
  writeTmpVotes(tmp);

  const memberUpvotedSlugs: string[] = [];
  for (const p of data.people) {
    const s = new Set<string>([...(p.upvoters || []), ...(tmp[p.slug] || [])]);
    if (s.has(memberSlug)) memberUpvotedSlugs.push(p.slug);
  }

  const updatedCookie: VotesCookiePayload = { m: memberSlug, u: memberUpvotedSlugs };
  return {
    upvoted,
    memberUpvotedSlugs,
    allVotes: getMergedVotes(updatedCookie),
  };
}

// Tips store (never includes raw email in public response)
export function readTips(): PersonTip[] {
  try {
    if (!fs.existsSync(TMP_TIPS_FILE)) return [];
    return JSON.parse(fs.readFileSync(TMP_TIPS_FILE, "utf8")) as PersonTip[];
  } catch {
    return [];
  }
}

export function saveTip(tip: Omit<PersonTip, "id" | "createdAt">): PersonTip {
  const full: PersonTip = {
    id: `${Date.now()}-${pslug(tip.name).slice(0, 24)}`,
    createdAt: new Date().toISOString(),
    ...tip,
  };
  const existing = readTips();
  existing.unshift(full);
  try {
    fs.writeFileSync(TMP_TIPS_FILE, JSON.stringify(existing, null, 2));
  } catch {
    // ignore
  }
  return full;
}

export function categoryName(slug: string): string {
  return categories.find((c) => c.slug === slug)?.name || slug;
}
