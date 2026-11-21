// Visibility: how widely known a listed person is today, separate from talent.
// Talent is list placement and is never scored. This module is the data layer only;
// it is not rendered on site pages. Signal scores and follower counts stay off the API.
import fs from "node:fs";
import path from "node:path";

export const VISIBILITY_METHOD = "v1" as const;
export const SIGNAL_KEYS = ["role", "press", "stage", "following", "peers"] as const;
export type SignalKey = (typeof SIGNAL_KEYS)[number];
export type SignalScore = 0 | 1 | 2 | 3 | 4;
export type VisibilityLevel = 1 | 2 | 3 | 4 | 5;
export type Nudge = -1 | 0 | 1;

export const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  1: "Under the radar",
  2: "Emerging",
  3: "Recognized",
  4: "Prominent",
  5: "Iconic",
};
export const UNCONFIRMED_LABEL = "Unconfirmed";

export const LEVEL_BANDS: Record<VisibilityLevel, readonly [number, number]> = {
  1: [0, 4],
  2: [5, 8],
  3: [9, 12],
  4: [13, 16],
  5: [17, 20],
};

const ENTRY_KEYS = new Set([
  "date", "signals", "nullReasons", "followingCounts", "total", "level", "status",
  "provisional", "nudge", "nudgeReason", "note", "sources", "spotted",
  "retroactive", "windowEnd", "event",
]);

const FOLLOW_PLATFORMS = ["x", "linkedin", "github", "substack"] as const;
export type FollowPlatform = (typeof FOLLOW_PLATFORMS)[number];

export type FollowingCounts = {
  x: number | null;
  linkedin: number | null;
  github: number | null; // followers, not stars
  substack: number | null;
  observedAt: string;
};

export type VisibilitySource = string | { url: string; signal?: SignalKey };
export type VisibilitySignals = Record<SignalKey, SignalScore | null>;

export type VisibilityEntry = {
  date: string;
  signals: VisibilitySignals;
  nullReasons?: Partial<Record<SignalKey, string>>;
  followingCounts?: FollowingCounts;
  total: number | null;
  level: VisibilityLevel | null;
  status?: "unconfirmed";
  provisional?: boolean;
  nudge?: Nudge;
  nudgeReason?: string;
  note?: string;
  sources: VisibilitySource[];
  spotted?: boolean;
  retroactive?: boolean;
  windowEnd?: string;
  event?: string;
};

export type VisibilityFile = {
  method: typeof VISIBILITY_METHOD;
  people: Record<string, VisibilityEntry[]>;
};

export type VisibilityValidation = { errors: string[]; warnings: string[] };

export type PublicVisibilityHistory = {
  date: string;
  level: VisibilityLevel | null;
  label: string;
  provisional: boolean;
  retroactive: boolean;
  note: string | null;
  sources: string[];
};

export type PublicVisibility = {
  level: VisibilityLevel | null;
  label: string;
  checked: string;
  spotted: { level: VisibilityLevel | null; label: string; date: string } | null;
  rise: number | null;
  history: PublicVisibilityHistory[];
};

const FILE = path.join(process.cwd(), "content", "visibility.json");
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function bandFromTotal(total: number): VisibilityLevel {
  if (total <= 4) return 1;
  if (total <= 8) return 2;
  if (total <= 12) return 3;
  if (total <= 16) return 4;
  return 5;
}

export function visibilityLabel(level: VisibilityLevel | null | undefined): string {
  return level == null ? UNCONFIRMED_LABEL : VISIBILITY_LABELS[level];
}

/** Combined known follower counts → 0–4 following band. 250k is still band 3; only counts above 250k are 4. */
export function followingBandFromSum(sum: number): SignalScore {
  if (sum < 2_000) return 0;
  if (sum < 10_000) return 1;
  if (sum < 50_000) return 2;
  if (sum <= 250_000) return 3;
  return 4;
}

export function sumKnownFollowers(counts: FollowingCounts): { sum: number; known: number } {
  let sum = 0, known = 0;
  for (const k of FOLLOW_PLATFORMS) {
    const n = counts[k];
    if (typeof n === "number") { sum += n; known++; }
  }
  return { sum, known };
}

export function knownSignalScores(signals: VisibilitySignals): { key: SignalKey; score: SignalScore }[] {
  return SIGNAL_KEYS.filter((k) => signals[k] !== null).map((k) => ({ key: k, score: signals[k] as SignalScore }));
}

/** Scale known 0–4 signals onto the 0–20 total. With all five present this is just their sum. */
export function computeTotal(signals: VisibilitySignals): number | null {
  const known = knownSignalScores(signals);
  if (!known.length) return null;
  const sum = known.reduce((s, x) => s + x.score, 0);
  return Math.round((sum * 20) / (4 * known.length));
}

export function clampLevel(n: number): VisibilityLevel {
  return Math.max(1, Math.min(5, Math.round(n))) as VisibilityLevel;
}

export function sourceUrl(s: VisibilitySource): string {
  return typeof s === "string" ? s : s.url;
}

/** Move up only at previous upper-band-edge + 2 or more; down only at lower-band-edge − 2 or less. */
export function hysteresisAllows(prevLevel: VisibilityLevel, nextLevel: VisibilityLevel, total: number): boolean {
  if (nextLevel === prevLevel) return true;
  const [lo, hi] = LEVEL_BANDS[prevLevel];
  if (nextLevel > prevLevel) return total >= hi + 2;
  return total <= lo - 2;
}

function isScore(n: unknown): n is SignalScore {
  return n === 0 || n === 1 || n === 2 || n === 3 || n === 4;
}

function isLevel(n: unknown): n is VisibilityLevel {
  return n === 1 || n === 2 || n === 3 || n === 4 || n === 5;
}

function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function sortEntries(entries: VisibilityEntry[]): VisibilityEntry[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.date < b.e.date ? -1 : a.e.date > b.e.date ? 1 : a.i - b.i))
    .map((x) => x.e);
}

export function validateEntry(slug: string, entry: VisibilityEntry, prev: VisibilityEntry | null): VisibilityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const at = `${slug}@${typeof entry?.date === "string" ? entry.date : "?"}`;
  const err = (m: string) => errors.push(`${at}: ${m}`);
  const warn = (m: string) => warnings.push(`${at}: ${m}`);

  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    err("entry must be an object");
    return { errors, warnings };
  }
  for (const k of Object.keys(entry)) if (!ENTRY_KEYS.has(k)) warn(`unknown field "${k}"`);
  if (!isIsoDate(entry.date)) err("date must be YYYY-MM-DD");

  const signals = entry.signals;
  if (!signals || typeof signals !== "object" || Array.isArray(signals)) {
    err("signals must be an object with role, press, stage, following, peers");
    return { errors, warnings };
  }
  for (const k of Object.keys(signals)) if (!(SIGNAL_KEYS as readonly string[]).includes(k)) err(`unknown signal "${k}"`);
  for (const k of SIGNAL_KEYS) {
    if (!(k in signals)) err(`missing signal "${k}"`);
    else if (signals[k] !== null && !isScore(signals[k])) err(`signal "${k}" must be 0–4 or null`);
  }

  const nulls = SIGNAL_KEYS.filter((k) => signals[k] === null);
  const reasons = entry.nullReasons ?? {};
  if (reasons && (typeof reasons !== "object" || Array.isArray(reasons))) err("nullReasons must be an object");
  else {
    for (const k of nulls) {
      const r = reasons[k];
      if (typeof r !== "string" || !r.trim()) err(`null signal "${k}" requires nullReasons.${k}`);
    }
    for (const k of Object.keys(reasons)) {
      if (!(SIGNAL_KEYS as readonly string[]).includes(k)) warn(`unknown nullReasons key "${k}"`);
      else if (!nulls.includes(k as SignalKey) && reasons[k as SignalKey]) warn(`nullReasons.${k} is set but that signal is not null`);
    }
  }

  const expectedTotal = computeTotal(signals);
  if (expectedTotal === null) {
    if (entry.total !== null) err("total must be null when every signal is null");
  } else if (entry.total !== expectedTotal) {
    err(`total must be ${expectedTotal} (got ${entry.total})`);
  } else if (!Number.isInteger(entry.total) || entry.total < 0 || entry.total > 20) {
    err("total must be an integer 0–20");
  }

  if (nulls.length >= 1 && entry.provisional !== true) err("provisional must be true when any signal is null");
  if (nulls.length === 0 && entry.provisional === true) err("provisional must not be true when every signal is scored");

  if (nulls.length >= 3) {
    if (entry.status !== "unconfirmed") err("status must be \"unconfirmed\" when 3 or more signals are null");
    if (entry.level !== null) err("level must be null when status is unconfirmed");
    if (entry.nudge === -1 || entry.nudge === 1) err("nudge is not allowed on an unconfirmed entry");
  } else {
    if (entry.status === "unconfirmed") err("status \"unconfirmed\" is only for entries with 3 or more null signals");
    const nudge = entry.nudge ?? 0;
    if (nudge !== -1 && nudge !== 0 && nudge !== 1) err("nudge must be -1, 0 or 1");
    if ((nudge === -1 || nudge === 1) && (typeof entry.nudgeReason !== "string" || !entry.nudgeReason.trim())) {
      err("nudge requires a nudgeReason");
    }
    if (expectedTotal == null) err("level cannot be computed without at least one scored signal");
    else {
      const expected = clampLevel(bandFromTotal(expectedTotal) + (nudge as number));
      if (!isLevel(entry.level)) err("level must be 1–5");
      else if (entry.level !== expected) err(`level ${entry.level} does not match band for total ${expectedTotal}` + (nudge ? ` with nudge ${nudge}` : "") + ` (expected ${expected})`);
    }
  }

  if (signals.following !== null || entry.followingCounts) {
    const fc = entry.followingCounts;
    if (signals.following !== null && !fc) err("followingCounts is required when following is scored");
    if (fc) {
      if (typeof fc !== "object" || Array.isArray(fc)) err("followingCounts must be an object");
      else {
        if (!isIsoDate(fc.observedAt)) err("followingCounts.observedAt must be YYYY-MM-DD");
        for (const k of FOLLOW_PLATFORMS) {
          const n = fc[k];
          if (n !== null && (!Number.isInteger(n) || n < 0)) err(`followingCounts.${k} must be a non-negative integer or null`);
        }
        for (const k of Object.keys(fc)) {
          if (k !== "observedAt" && !(FOLLOW_PLATFORMS as readonly string[]).includes(k)) warn(`unknown followingCounts key "${k}"`);
        }
        const { sum, known } = sumKnownFollowers(fc);
        if (signals.following !== null) {
          if (!known) err("followingCounts needs at least one platform count when following is scored");
          else if (followingBandFromSum(sum) !== signals.following) {
            err(`following score ${signals.following} does not match band ${followingBandFromSum(sum)} for summed known counts (${sum})`);
          }
        }
      }
    }
  }

  if (!Array.isArray(entry.sources)) err("sources must be an array");
  else {
    if (entry.sources.length > 6) err("sources may have at most 6 URLs");
    entry.sources.forEach((s, i) => {
      if (typeof s === "string") {
        if (!isHttpUrl(s)) err(`sources[${i}] is not an http(s) URL`);
      } else if (!s || typeof s !== "object" || Array.isArray(s)) {
        err(`sources[${i}] must be a URL string or { url, signal? }`);
      } else {
        if (!isHttpUrl(s.url)) err(`sources[${i}].url is not an http(s) URL`);
        if (s.signal !== undefined && !(SIGNAL_KEYS as readonly string[]).includes(s.signal)) {
          err(`sources[${i}].signal must be one of ${SIGNAL_KEYS.join(", ")}`);
        }
        for (const k of Object.keys(s)) if (k !== "url" && k !== "signal") warn(`sources[${i}] unknown field "${k}"`);
      }
    });
  }

  if (entry.note !== undefined && (typeof entry.note !== "string" || /\r|\n/.test(entry.note))) err("note must be a single line");
  if (entry.spotted !== undefined && entry.spotted !== true && entry.spotted !== false) err("spotted must be true when present");
  if (entry.retroactive === true && !isIsoDate(entry.windowEnd)) err("retroactive entries require windowEnd (YYYY-MM-DD)");
  else if (entry.windowEnd !== undefined && !isIsoDate(entry.windowEnd)) err("windowEnd must be YYYY-MM-DD");
  if (entry.event !== undefined && (typeof entry.event !== "string" || !entry.event.trim())) err("event must be a non-empty reason when present");

  if (prev && isLevel(prev.level) && isLevel(entry.level) && entry.level !== prev.level) {
    const total = typeof entry.total === "number" ? entry.total : NaN;
    const hasEvent = typeof entry.event === "string" && entry.event.trim().length > 0;
    if (!hasEvent && Number.isFinite(total) && !hysteresisAllows(prev.level, entry.level, total)) {
      const [lo, hi] = LEVEL_BANDS[prev.level];
      warn(
        `level change ${prev.level} → ${entry.level} at total ${total} skips hysteresis ` +
        `(up at ≥ ${hi + 2}, down at ≤ ${lo - 2}) and has no event reason`,
      );
    }
  }

  return { errors, warnings };
}

export function validateVisibilityData(data: unknown, knownSlugs: Set<string>): VisibilityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { errors: ["visibility file must be an object with method and people"], warnings };
  }
  const file = data as VisibilityFile;
  if (file.method !== VISIBILITY_METHOD) errors.push(`method must be "${VISIBILITY_METHOD}"`);
  if (!file.people || typeof file.people !== "object" || Array.isArray(file.people)) {
    errors.push("people must be an object of slug → entries");
    return { errors, warnings };
  }
  for (const [slug, entries] of Object.entries(file.people)) {
    if (knownSlugs.size && !knownSlugs.has(slug)) warnings.push(`${slug}: unknown slug (not on any current or archived list)`);
    if (!Array.isArray(entries)) {
      errors.push(`${slug}: value must be an array of entries`);
      continue;
    }
    const spottedAt = entries
      .map((e, i) => (e && e.spotted === true ? i : -1))
      .filter((i) => i >= 0);
    if (entries.length > 0 && spottedAt.length === 0) errors.push(`${slug}: exactly one entry must have spotted: true`);
    if (spottedAt.length > 1) errors.push(`${slug}: only one entry may have spotted: true`);
    const ordered = sortEntries(entries.filter((e) => e && typeof e === "object"));
    let prev: VisibilityEntry | null = null;
    for (const entry of ordered) {
      const r = validateEntry(slug, entry, prev);
      errors.push(...r.errors);
      warnings.push(...r.warnings);
      prev = entry;
    }
  }
  return { errors, warnings };
}

export function readVisibilityFile(file = FILE): VisibilityFile {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw) as VisibilityFile;
  return data;
}

let slugsProvider: (() => Set<string>) | null = null;
let store: Map<string, VisibilityEntry[]> | null = null;

export function initVisibility(getSlugs: () => Set<string>) {
  slugsProvider = getSlugs;
  store = null;
  loadVisibility();
}

export function loadVisibility(file = FILE): Map<string, VisibilityEntry[]> {
  if (store && file === FILE) return store;
  const data = readVisibilityFile(file);
  const slugs = slugsProvider ? slugsProvider() : new Set<string>();
  const result = validateVisibilityData(data, slugs);
  for (const w of result.warnings) console.warn(`visibility: ${w}`);
  if (result.errors.length) {
    throw new Error(`Invalid content/visibility.json:\n${result.errors.map((e) => `- ${e}`).join("\n")}`);
  }
  const next = new Map<string, VisibilityEntry[]>();
  for (const [slug, entries] of Object.entries(data.people)) next.set(slug, sortEntries(entries));
  if (file === FILE) store = next;
  return next;
}

export function history(slug: string): VisibilityEntry[] {
  return loadVisibility().get(slug) ?? [];
}

export function currentVisibility(slug: string): VisibilityEntry | null {
  const entries = history(slug);
  return entries.length ? entries[entries.length - 1] : null;
}

export function spottedVisibility(slug: string): VisibilityEntry | null {
  return history(slug).find((e) => e.spotted === true) ?? null;
}

function publicHistoryItem(e: VisibilityEntry): PublicVisibilityHistory {
  return {
    date: e.date,
    level: e.level,
    label: visibilityLabel(e.level),
    provisional: e.provisional === true,
    retroactive: e.retroactive === true,
    note: typeof e.note === "string" && e.note.trim() ? e.note.trim() : null,
    sources: (e.sources ?? []).map(sourceUrl).filter(Boolean),
  };
}

function spottedDate(e: VisibilityEntry): string {
  return e.retroactive && isIsoDate(e.windowEnd) ? e.windowEnd : e.date;
}

export function publicVisibility(slug: string): PublicVisibility | null {
  const entries = history(slug);
  if (!entries.length) return null;
  const current = entries[entries.length - 1];
  const spotted = entries.find((e) => e.spotted === true) ?? null;
  const rise =
    current.level != null && spotted?.level != null ? current.level - spotted.level : null;
  return {
    level: current.level,
    label: visibilityLabel(current.level),
    checked: current.date,
    spotted: spotted
      ? { level: spotted.level, label: visibilityLabel(spotted.level), date: spottedDate(spotted) }
      : null,
    rise,
    history: entries.map(publicHistoryItem),
  };
}
