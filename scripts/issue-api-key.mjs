#!/usr/bin/env node
/**
 * Issue a new Ella API key.
 *
 * Usage: node scripts/issue-api-key.mjs <label>
 *
 * Writes the plaintext key only to /workspace/ella/private/api-keys/<label>.txt
 * (chmod 600). Appends { id, label, hash, created } to registry.json.
 * Never prints the key value.
 */
import { createHash, randomBytes } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const DIR = "/workspace/ella/private/api-keys";
const REGISTRY = join(DIR, "registry.json");
const label = (process.argv[2] || "").trim();

if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(label)) {
  console.error("Usage: node scripts/issue-api-key.mjs <label>");
  console.error("Label must be 1–64 chars: letters, digits, dot, underscore or hyphen.");
  process.exit(1);
}

const keyPath = join(DIR, `${label}.txt`);
if (existsSync(keyPath)) {
  console.error(`A key file for "${label}" already exists. Refusing to overwrite.`);
  process.exit(1);
}

mkdirSync(DIR, { recursive: true, mode: 0o700 });
chmodSync(DIR, 0o700);

let registry = [];
if (existsSync(REGISTRY)) {
  try {
    const parsed = JSON.parse(readFileSync(REGISTRY, "utf8"));
    if (Array.isArray(parsed)) registry = parsed;
  } catch {
    console.error("Could not read existing registry.json.");
    process.exit(1);
  }
}
if (registry.some((r) => r && r.label === label)) {
  console.error(`Registry already has a key labeled "${label}". Refusing to issue another.`);
  process.exit(1);
}

const id = `k_${randomBytes(8).toString("hex")}`;
const secret = randomBytes(24).toString("base64url");
const key = `ella_live_${secret}`;
if (key.length < "ella_live_".length + 32) {
  console.error("Generated key was shorter than expected.");
  process.exit(1);
}
const hash = createHash("sha256").update(key, "utf8").digest("hex");
const created = new Date().toISOString();

writeFileSync(keyPath, `${key}\n`, { mode: 0o600, flag: "wx" });
chmodSync(keyPath, 0o600);

registry.push({ id, label, hash, created });
writeFileSync(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`, { mode: 0o600 });
chmodSync(REGISTRY, 0o600);

console.log(`Issued key id=${id} label=${label}.`);
console.log(`Plaintext written to ${keyPath} (chmod 600). The key value is not printed.`);
console.log(`Update ELLA_API_KEYS from ${REGISTRY} (Preview or Production env).`);
