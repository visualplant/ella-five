import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { resendFetch, sendListUpdateEmail, TOPICS } from "@/lib/resend";

// Admin-only: emails a list update to the subscribers of ONE category.
// Guarded by LIST_UPDATE_ADMIN_TOKEN (Authorization: Bearer <token>).
// The response never contains subscriber emails, only counts.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SEGMENT_NAME = "Ella - Subscribers";
const TEST_ADDRESS = "jsn@visualplant.net";
const SEND_GAP_MS = 300; // ~3 req/s, well under Resend's 10 req/s team limit
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

function authorized(req: Request): boolean | null {
  const expected = process.env.LIST_UPDATE_ADMIN_TOKEN;
  if (!expected) return null;
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") || "");
  if (!m) return false;
  // Hash both sides so lengths match and the comparison is constant time.
  const a = createHash("sha256").update(m[1].trim()).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

async function findSegmentId(): Promise<string | null> {
  let after = "";
  for (let page = 0; page < 50; page++) {
    const r = await resendFetch(`/segments?limit=100${after ? `&after=${after}` : ""}`);
    if (!r.ok) break;
    const j = (await r.json()) as { data?: { id: string; name: string }[]; has_more?: boolean };
    const hit = j.data?.find((s) => s.name === SEGMENT_NAME);
    if (hit) return hit.id;
    if (!j.has_more || !j.data?.length) break;
    after = j.data[j.data.length - 1].id;
  }
  return process.env.RESEND_AUDIENCE_ID || null;
}

type Contact = { id: string; email: string; unsubscribed?: boolean };
async function listSegmentContacts(segmentId: string): Promise<Contact[]> {
  const out: Contact[] = [];
  let after = "";
  for (let page = 0; page < 1000; page++) {
    const r = await resendFetch(`/contacts?segment_id=${encodeURIComponent(segmentId)}&limit=100${after ? `&after=${after}` : ""}`);
    if (!r.ok) throw new Error(`Resend list contacts failed (${r.status})`);
    const j = (await r.json()) as { data?: Contact[]; has_more?: boolean };
    out.push(...(j.data || []));
    if (!j.has_more || !j.data?.length) break;
    after = j.data[j.data.length - 1].id;
    await sleep(SEND_GAP_MS);
  }
  return out;
}

async function optedIn(contactId: string, topicId: string): Promise<boolean> {
  let after = "";
  for (let page = 0; page < 20; page++) {
    const r = await resendFetch(`/contacts/${encodeURIComponent(contactId)}/topics?limit=100${after ? `&after=${after}` : ""}`);
    if (!r.ok) throw new Error(`Resend contact topics failed (${r.status})`);
    const j = (await r.json()) as { data?: { id: string; subscription: string }[]; has_more?: boolean };
    const t = j.data?.find((x) => x.id === topicId);
    if (t) return t.subscription === "opt_in";
    if (!j.has_more || !j.data?.length) return false; // topics default to opt_out
    after = j.data[j.data.length - 1].id;
  }
  return false;
}

export async function POST(req: Request) {
  const auth = authorized(req);
  if (auth === null) return json({ error: "Endpoint not configured" }, 503);
  if (!auth) return json({ error: "Unauthorized" }, 401);

  const b = await req.json().catch(() => null);
  const category = String(b?.category || "");
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return json({ error: "Unknown category", valid: categories.map((c) => c.slug) }, 400);
  const dryRun = b?.dryRun === true;
  const subject = typeof b?.subject === "string" ? b.subject.trim() : "";
  const textBody = typeof b?.textBody === "string" ? b.textBody : "";
  const htmlBody = typeof b?.htmlBody === "string" ? b.htmlBody : "";
  const testTo = typeof b?.testTo === "string" ? b.testTo.trim().toLowerCase() : "";
  if (testTo && testTo !== TEST_ADDRESS) return json({ error: `testTo may only be ${TEST_ADDRESS}` }, 400);
  if (!dryRun && (!subject || !textBody.trim() || !htmlBody.trim())) return json({ error: "subject, textBody and htmlBody are required" }, 400);

  if (!process.env.RESEND_API_KEY) return json({ error: "RESEND_API_KEY not set" }, 503);
  if (!dryRun && !process.env.EMAIL_FROM) return json({ error: "EMAIL_FROM not set" }, 503);
  const warnings: string[] = [];
  if (!process.env.SUBSCRIBE_SECRET) warnings.push("SUBSCRIBE_SECRET not set: unsubscribe links will not verify on production");
  const send = (email: string) => sendListUpdateEmail({ email, cats: [cat.slug], names: cat.name, subject, textBody, htmlBody });

  // Test mode: one email to the fixed test address only; no subscriber lookup.
  if (testTo) {
    if (dryRun) return json({ category: cat.slug, mode: "test", dryRun: true, recipients: 1, warnings });
    const ok = await send(testTo);
    return json({ category: cat.slug, mode: "test", recipients: 1, sent: ok ? 1 : 0, failed: ok ? 0 : 1, warnings }, ok ? 200 : 502);
  }

  // Real sends need the production signing secret so unsubscribe links work.
  if (!dryRun && !process.env.SUBSCRIBE_SECRET) return json({ error: "SUBSCRIBE_SECRET not set; refusing to send" }, 503);
  const topicId = TOPICS[cat.slug];
  if (!topicId) return json({ error: `RESEND_TOPIC_${cat.slug.toUpperCase()} not set` }, 503);

  try {
    const segmentId = await findSegmentId();
    if (!segmentId) return json({ error: `Segment "${SEGMENT_NAME}" not found` }, 503);
    const contacts = (await listSegmentContacts(segmentId)).filter((c) => !c.unsubscribed && c.email);
    const seen = new Set<string>();
    const recipients: string[] = [];
    let lookupFailures = 0;
    for (const c of contacts) {
      const email = c.email.trim().toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      try { if (await optedIn(c.id, topicId)) recipients.push(email); } catch { lookupFailures++; }
      await sleep(SEND_GAP_MS);
    }
    const base = { category: cat.slug, segmentContacts: contacts.length, recipients: recipients.length, topicLookupFailures: lookupFailures, warnings };
    if (dryRun) return json({ ...base, dryRun: true });

    let sent = 0;
    const failures: { index: number; error: string }[] = [];
    for (let i = 0; i < recipients.length; i++) {
      try { if (await send(recipients[i])) sent++; else failures.push({ index: i, error: "Resend rejected the send" }); }
      catch (e) { failures.push({ index: i, error: e instanceof Error ? e.message : "send failed" }); }
      await sleep(SEND_GAP_MS);
    }
    return json({ ...base, sent, failed: failures.length, failures }, failures.length && !sent ? 502 : 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Resend error" }, 502);
  }
}
