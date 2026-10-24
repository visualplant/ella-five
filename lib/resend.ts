import { createHmac, timingSafeEqual } from "crypto";
import { SITE } from "@/lib/data";

const KEY = () => process.env.RESEND_API_KEY;
const SECRET = () => process.env.SUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "ella-rising-stars-cookie-key";
export const enabled = () => Boolean(KEY() && process.env.EMAIL_FROM && process.env.RESEND_AUDIENCE_ID);
// One Resend Audience holds every subscriber; each category is a Resend Topic
// (opt-out by default, so a contact receives only the topics they opted into).
export const AUDIENCE = () => process.env.RESEND_AUDIENCE_ID;
const CATS = ["technical", "design", "research", "product", "growth"];
// Topic IDs come from env (RESEND_TOPIC_TECHNICAL, ...); see .env.example.
export const TOPICS: Record<string, string> = Object.fromEntries(
  CATS.map((c) => [c, process.env[`RESEND_TOPIC_${c.toUpperCase()}`] || ""]).filter(([, v]) => v),
);

export type PendingTip = {
  name: string;
  url: string | null;
  category: string | null;
  note: string | null;
};

export type Payload = {
  e: string;
  c: string[];
  a: "confirm" | "unsubscribe";
  x: number;
  m?: string;
  vote?: string;
  tip?: PendingTip;
  next?: string;
};

const b64 = (s: string) => Buffer.from(s).toString("base64url");
const sig = (s: string) => createHmac("sha256", SECRET()).update(s).digest("base64url");
export function sign(p: Omit<Payload, "x">, ttlDays: number) {
  const body = b64(JSON.stringify({ ...p, x: Date.now() + ttlDays * 864e5 }));
  return `${body}.${sig(body)}`;
}
export function verify(token: string, action: Payload["a"]): Payload | null {
  const [body, s] = token.split(".");
  if (!body || !s || !SECRET()) return null;
  const a = Buffer.from(sig(body)), b = Buffer.from(s);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload; return p.a === action && p.x > Date.now() ? p : null; } catch { return null; }
}

async function api(path: string, method: string, body?: unknown) {
  const r = await fetch(`https://api.resend.com${path}`, { method, headers: { authorization: `Bearer ${KEY()}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return r.ok;
}

/** RFC 8058 one-click List-Unsubscribe header URL (/api/unsubscribe?token=...) */
export const unsubscribeUrl = (email: string, cats: string[]) => `${SITE}/api/unsubscribe?token=${sign({ e: email, c: cats, a: "unsubscribe" }, 3650)}`;

/** Dedicated interactive unsubscribe & re-subscribe page URL (/unsubscribe?token=...) for email footers */
export const unsubscribePageUrl = (email: string, cats: string[], origin = SITE) =>
  `${origin.replace(/\/$/, "")}/unsubscribe?token=${sign({ e: email, c: cats, a: "unsubscribe" }, 3650)}`;

export async function sendConfirm(email: string, cats: string[], names: string) {
  const confirm = `${SITE}/api/confirm?token=${sign({ e: email, c: cats, a: "confirm" }, 2)}`;
  const unsub = unsubscribeUrl(email, cats);
  const unsubPage = unsubscribePageUrl(email, cats);
  return api("/emails", "POST", { from: process.env.EMAIL_FROM, to: email, subject: "Confirm your Ella subscription",
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    text: `Hi,\n\nPlease confirm you'd like updates when these Ella lists change: ${names}.\n\n${confirm}\n\nThis link expires in 48 hours. If this wasn't you, ignore this email and nothing happens.\n\nElla\n\n---\nManage subscription or unsubscribe: ${unsubPage}`,
    html: `<p>Hi,</p><p>Please confirm you'd like updates when these Ella lists change: <b>${names}</b>.</p><p><a href="${confirm}">Confirm subscription</a></p><p style="color:#888">This link expires in 48 hours. If this wasn't you, ignore this email.</p><p>Ella</p><hr style="border:0;border-top:1px solid #e4ddd2;margin:24px 0 12px"/><p style="font-size:12px;color:#9a8f82">Subscribed as ${email} to ${names}. <a href="${unsubPage}" style="color:#6b6258">Unsubscribe or manage lists</a></p>` });
}

/**
 * Sends a list-update email blast to a subscriber with the dedicated /unsubscribe?token=... link at the bottom.
 */
export async function sendListUpdateEmail(opts: {
  email: string;
  cats: string[];
  names: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}) {
  const unsub = unsubscribeUrl(opts.email, opts.cats);
  const unsubPage = unsubscribePageUrl(opts.email, opts.cats);
  return api("/emails", "POST", {
    from: process.env.EMAIL_FROM,
    to: opts.email,
    subject: opts.subject,
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    text: `${opts.textBody.trim()}\n\n—\nYou are subscribed as ${opts.email} to ${opts.names}.\nUnsubscribe or manage your subscription: ${unsubPage}`,
    html: `${opts.htmlBody}<hr style="border:0;border-top:1px solid #e4ddd2;margin:28px 0 14px"/><p style="font-size:12px;color:#9a8f82;line-height:1.5">You are subscribed as ${opts.email} to ${opts.names}. <a href="${unsubPage}" style="color:#6b6258">Unsubscribe?</a></p>`,
  });
}

export async function sendRisingVerify(opts: {
  email: string;
  memberSlug: string;
  memberName: string;
  cats: string[];
  vote?: { targetSlug: string; targetName: string };
  tip?: PendingTip;
  origin?: string;
}) {
  const base = (opts.origin || SITE).replace(/\/$/, "");
  const token = sign(
    {
      e: opts.email,
      c: opts.cats,
      a: "confirm",
      m: opts.memberSlug,
      ...(opts.vote ? { vote: opts.vote.targetSlug } : {}),
      ...(opts.tip ? { tip: opts.tip } : {}),
      next: "/rising-stars",
    },
    2,
  );
  const confirm = `${base}/api/confirm?token=${token}`;
  const unsub = unsubscribeUrl(opts.email, opts.cats);
  const unsubPage = unsubscribePageUrl(opts.email, opts.cats, base);
  const actionLine = opts.vote
    ? `confirm your upvote for ${opts.vote.targetName} on Ella’s Rising Stars`
    : opts.tip
      ? `confirm your tip (${opts.tip.name}) for Ella`
      : "confirm your Ella list-member email";
  const ctaLabel = opts.vote
    ? `Confirm upvote for ${opts.vote.targetName}`
    : opts.tip
      ? `Confirm tip for ${opts.tip.name}`
      : "Confirm email";
  const subject = opts.vote
    ? `Confirm your upvote for ${opts.vote.targetName} – Ella`
    : opts.tip
      ? `Confirm your tip for Ella (${opts.tip.name})`
      : "Confirm your email – Ella";

  if (!enabled()) return { sent: false, confirmUrl: confirm };

  const ok = await api("/emails", "POST", {
    from: process.env.EMAIL_FROM,
    to: opts.email,
    subject,
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    text: `Hi ${opts.memberName},\n\nClick the link below to ${actionLine}:\n\n${confirm}\n\nOnce confirmed, future upvotes and tips from this browser happen in one click. This link expires in 48 hours. If this wasn't you, ignore this email.\n\nElla\n\n---\nUnsubscribe: ${unsubPage}`,
    html: `<p>Hi ${opts.memberName},</p><p>Click the link below to ${actionLine}:</p><p><a href="${confirm}">${ctaLabel}</a></p><p style="color:#888">Once confirmed, future upvotes and tips from this browser happen in one click. This link expires in 48 hours. If this wasn't you, ignore this email.</p><p>Ella</p><hr style="border:0;border-top:1px solid #e4ddd2;margin:24px 0 12px"/><p style="font-size:12px;color:#9a8f82"><a href="${unsubPage}" style="color:#6b6258">Unsubscribe or manage lists</a></p>`,
  });
  return { sent: ok, confirmUrl: confirm };
}

const setTopics = (email: string, cats: string[], sub: "opt_in" | "opt_out") =>
  api(`/contacts/${encodeURIComponent(email)}/topics`, "PATCH", cats.filter((c) => TOPICS[c]).map((c) => ({ id: TOPICS[c], subscription: sub })));

export async function addContacts(email: string, cats: string[]) {
  // Create (or keep) the contact in the single audience, then opt it into the chosen topics.
  await api(`/audiences/${AUDIENCE()}/contacts`, "POST", { email, unsubscribed: false });
  return setTopics(email, cats, "opt_in");
}
export async function unsubscribeContacts(email: string, cats: string[]) {
  // Per-list unsubscribe: opt out of the topics in the token; the contact stays for other lists.
  return setTopics(email, cats, "opt_out");
}
