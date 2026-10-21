import { createHmac, timingSafeEqual } from "crypto";
import { SITE } from "@/lib/data";

const KEY = () => process.env.RESEND_API_KEY;
const SECRET = () => process.env.SUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "";
export const enabled = () => Boolean(KEY() && process.env.EMAIL_FROM && process.env.RESEND_AUDIENCE_ID);
// One Resend Audience holds every subscriber; each category is a Resend Topic
// (opt-out by default, so a contact receives only the topics they opted into).
export const AUDIENCE = () => process.env.RESEND_AUDIENCE_ID;
const CATS = ["technical", "design", "research", "product", "growth"];
// Topic IDs come from env (RESEND_TOPIC_TECHNICAL, ...); see .env.example.
export const TOPICS: Record<string, string> = Object.fromEntries(
  CATS.map((c) => [c, process.env[`RESEND_TOPIC_${c.toUpperCase()}`] || ""]).filter(([, v]) => v),
);
type Payload = { e: string; c: string[]; a: "confirm" | "unsubscribe"; x: number };
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
export const unsubscribeUrl = (email: string, cats: string[]) => `${SITE}/api/unsubscribe?token=${sign({ e: email, c: cats, a: "unsubscribe" }, 3650)}`;

export async function sendConfirm(email: string, cats: string[], names: string) {
  const confirm = `${SITE}/api/confirm?token=${sign({ e: email, c: cats, a: "confirm" }, 2)}`;
  const unsub = unsubscribeUrl(email, cats);
  return api("/emails", "POST", { from: process.env.EMAIL_FROM, to: email, subject: "Confirm your Ella subscription",
    headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    text: `Hi,\n\nPlease confirm you'd like updates when these Ella lists change: ${names}.\n\n${confirm}\n\nThis link expires in 48 hours. If this wasn't you, ignore this email and nothing happens.\n\nElla`,
    html: `<p>Hi,</p><p>Please confirm you'd like updates when these Ella lists change: <b>${names}</b>.</p><p><a href="${confirm}">Confirm subscription</a></p><p style="color:#888">This link expires in 48 hours. If this wasn't you, ignore this email.</p><p>Ella</p>` });
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
