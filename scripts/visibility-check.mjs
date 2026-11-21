#!/usr/bin/env node
/**
 * Validate content/visibility.json before committing.
 * Run from the site root: npm run visibility:check
 *
 * Also runs a self-test of banding, null-signal scaling, following bands,
 * nudge, and hysteresis rules. Does not invent data into the file.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  bandFromTotal,
  computeTotal,
  followingBandFromSum,
  hysteresisAllows,
  readVisibilityFile,
  validateEntry,
  validateVisibilityData,
} from "../lib/visibility.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function pslug(name) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function knownSlugs() {
  const slugs = new Set();
  const files = [join(root, "data/verticals/ai.json")];
  const weekly = join(root, "data/weekly");
  for (const f of readdirSync(weekly)) if (f.endsWith(".json")) files.push(join(weekly, f));
  for (const file of files) {
    const data = JSON.parse(readFileSync(file, "utf8"));
    for (const c of data.categories ?? []) for (const p of c.people ?? []) slugs.add(pslug(p.name));
  }
  return slugs;
}

let failed = 0;
function assert(name, cond) {
  if (!cond) {
    failed++;
    console.error("FAIL", name);
  } else {
    console.log("ok  ", name);
  }
}

assert("band 0-4 is 1", bandFromTotal(0) === 1 && bandFromTotal(4) === 1);
assert("band 5-8 is 2", bandFromTotal(5) === 2 && bandFromTotal(8) === 2);
assert("band 9-12 is 3", bandFromTotal(9) === 3 && bandFromTotal(12) === 3);
assert("band 13-16 is 4", bandFromTotal(13) === 4 && bandFromTotal(16) === 4);
assert("band 17-20 is 5", bandFromTotal(17) === 5 && bandFromTotal(20) === 5);
assert("all five signals total is the sum", computeTotal({ role: 4, press: 3, stage: 2, following: 2, peers: 3 }) === 14);
assert("two nulls scale to 20", computeTotal({ role: 4, press: 2, stage: 3, following: null, peers: null }) === 15);
assert("no signals → null total", computeTotal({ role: null, press: null, stage: null, following: null, peers: null }) === null);
assert("following bands", followingBandFromSum(1999) === 0 && followingBandFromSum(2000) === 1 && followingBandFromSum(9999) === 1 && followingBandFromSum(10000) === 2 && followingBandFromSum(49999) === 2 && followingBandFromSum(50000) === 3 && followingBandFromSum(250000) === 3 && followingBandFromSum(250001) === 4);
assert("hysteresis: from 2, up only at >= 10", hysteresisAllows(2, 3, 9) === false && hysteresisAllows(2, 3, 10) === true);
assert("hysteresis: from 2, down only at <= 3", hysteresisAllows(2, 1, 4) === false && hysteresisAllows(2, 1, 3) === true);
assert("hysteresis: from 3, up at >= 14, down at <= 7", hysteresisAllows(3, 4, 13) === false && hysteresisAllows(3, 4, 14) === true && hysteresisAllows(3, 2, 8) === false && hysteresisAllows(3, 2, 7) === true);

const example = {
  date: "2026-11-21",
  signals: { role: 4, press: 3, stage: 2, following: 2, peers: 3 },
  followingCounts: { x: 12000, linkedin: 8000, github: 1500, substack: null, observedAt: "2026-11-21" },
  total: 14,
  level: 4,
  note: "Example only — not a real person.",
  sources: ["https://example.com/profile", { url: "https://example.com/interview", signal: "press" }],
  spotted: true,
};
const ex = validateEntry("example-person", example, null);
assert("example entry validates", ex.errors.length === 0);

const provisional = {
  date: "2026-11-21",
  signals: { role: 4, press: 2, stage: 3, following: null, peers: null },
  nullReasons: { following: "No reliable public counts yet.", peers: "Too few independent mentions to score." },
  total: 15,
  level: 4,
  provisional: true,
  note: "Provisional example.",
  sources: [],
  spotted: true,
};
assert("provisional with 2 nulls validates", validateEntry("example-person", provisional, null).errors.length === 0);

const unconfirmed = {
  date: "2026-11-21",
  signals: { role: 2, press: null, stage: null, following: null, peers: 1 },
  nullReasons: { press: "No coverage found.", stage: "No talks found.", following: "Counts unavailable." },
  total: 8,
  level: null,
  status: "unconfirmed",
  provisional: true,
  note: "Unconfirmed example.",
  sources: [],
  spotted: true,
};
assert("3 nulls is unconfirmed", validateEntry("example-person", unconfirmed, null).errors.length === 0);

const badNudge = {
  ...example,
  level: 5,
  nudge: 1,
};
assert("nudge without reason fails", validateEntry("example-person", badNudge, null).errors.some((e) => /nudgeReason/.test(e)));

const flicker = {
  date: "2026-12-21",
  signals: { role: 3, press: 2, stage: 2, following: 1, peers: 1 },
  followingCounts: { x: 3000, linkedin: 1000, github: 200, substack: null, observedAt: "2026-12-21" },
  total: 9,
  level: 3,
  note: "Would flicker 2 → 3 at total 9.",
  sources: [],
};
const h = validateEntry("example-person", flicker, { ...example, level: 2, total: 7 });
assert("hysteresis violation warns, does not fail", h.errors.length === 0 && h.warnings.some((w) => /hysteresis/.test(w)));

if (failed) {
  console.error(`\n${failed} self-test(s) failed`);
  process.exit(1);
}
console.log("\nself-test passed");

const file = join(root, "content/visibility.json");
const data = readVisibilityFile(file);
const slugs = knownSlugs();
const result = validateVisibilityData(data, slugs);
for (const w of result.warnings) console.warn("warn", w);
for (const e of result.errors) console.error("error", e);
const people = Object.keys(data.people || {}).length;
const entries = Object.values(data.people || {}).reduce((n, arr) => n + arr.length, 0);
console.log(`checked ${file} (${people} people, ${entries} entries, ${slugs.size} known slugs)`);
if (result.errors.length) {
  console.error(`${result.errors.length} error(s)`);
  process.exit(1);
}
console.log("visibility.json is valid");
