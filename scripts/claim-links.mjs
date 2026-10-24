#!/usr/bin/env node
// Generates signed ?claim=<token> links for Ella's 5x5 list members (current + archive).
// Usage: node scripts/claim-links.mjs [slug-filter]
import fs from "node:fs";
import path from "node:path";
import { createHmac } from "node:crypto";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// Load .env.local if present so tokens match local/configured secret
for (const envFile of [".env.local", ".env"]) {
  const p = path.join(root, envFile);
  if (fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"(.*)"$/, "$1");
    }
  }
}

const secret = process.env.SUBSCRIBE_SECRET || process.env.RESEND_API_KEY || "ella-rising-stars-cookie-key";
const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://ellafive.com").replace(/\/$/, "");
const pslug = (s) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const signClaim = (memberSlug) => {
  const body = Buffer.from(JSON.stringify({ a: "claim", m: memberSlug })).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
};

const ai = JSON.parse(fs.readFileSync(path.join(root, "data", "verticals", "ai.json"), "utf8"));
const weeklyDir = path.join(root, "data", "weekly");
const weeklyFiles = fs.existsSync(weeklyDir)
  ? fs.readdirSync(weeklyDir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort()
  : [];

const seen = new Map();
for (const f of weeklyFiles) {
  const v = JSON.parse(fs.readFileSync(path.join(weeklyDir, f), "utf8"));
  for (const c of v.categories) for (const p of c.people) seen.set(pslug(p.name), { name: p.name, category: c.slug, slug: pslug(p.name) });
}
for (const c of ai.categories) for (const p of c.people) seen.set(pslug(p.name), { name: p.name, category: c.slug, slug: pslug(p.name) });

const filter = (process.argv[2] || "").toLowerCase();
for (const m of seen.values()) {
  if (filter && !m.slug.includes(filter) && !m.name.toLowerCase().includes(filter)) continue;
  const tok = signClaim(m.slug);
  console.log(`${m.name.padEnd(26)} (${m.category.padEnd(9)}) -> ${site}/rising-stars?claim=${tok}`);
}
