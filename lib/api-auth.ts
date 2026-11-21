import { createHash, timingSafeEqual } from "node:crypto";

export type ApiKeyRecord = {
  id: string;
  label: string;
  hash: string;
  created: string;
};

const LIMIT = 60;
const WINDOW_MS = 60_000;
const buckets = new Map<string, number[]>();

function loadKeys(): ApiKeyRecord[] {
  const raw = process.env.ELLA_API_KEYS;
  if (!raw || !raw.trim()) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.flatMap((row) => {
      if (!row || typeof row !== "object") return [];
      const r = row as Record<string, unknown>;
      const id = typeof r.id === "string" ? r.id : "";
      const label = typeof r.label === "string" ? r.label : "";
      const hash = typeof r.hash === "string" ? r.hash.toLowerCase() : "";
      const created = typeof r.created === "string" ? r.created : "";
      if (!id || !label || !/^[0-9a-f]{64}$/.test(hash)) return [];
      return [{ id, label, hash, created }];
    });
  } catch {
    return [];
  }
}

function corsHeaders(): Headers {
  return new Headers({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "Authorization, Content-Type",
    "access-control-max-age": "86400",
    vary: "Authorization",
  });
}

export function apiOptions(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export function apiJson(
  body: unknown,
  init?: { status?: number; remaining?: number; reset?: number },
): Response {
  const headers = corsHeaders();
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "private, no-store");
  if (init?.remaining !== undefined) {
    headers.set("x-ratelimit-limit", String(LIMIT));
    headers.set("x-ratelimit-remaining", String(Math.max(0, init.remaining)));
  }
  if (init?.reset !== undefined) {
    headers.set("x-ratelimit-reset", String(Math.ceil(init.reset / 1000)));
    if (init.status === 429) headers.set("retry-after", String(Math.max(1, Math.ceil((init.reset - Date.now()) / 1000))));
  }
  return new Response(JSON.stringify(body, null, 2), { status: init?.status ?? 200, headers });
}

function matchKey(token: string): ApiKeyRecord | null {
  const digest = createHash("sha256").update(token, "utf8").digest();
  let found: ApiKeyRecord | null = null;
  for (const key of loadKeys()) {
    const buf = Buffer.from(key.hash, "hex");
    if (buf.length !== digest.length) continue;
    if (timingSafeEqual(buf, digest)) found = key;
  }
  return found;
}

function takeToken(req: Request): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") || "");
  return m ? m[1].trim() : null;
}

function rateLimit(id: string): { ok: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const recent = (buckets.get(id) ?? []).filter((t) => now - t < WINDOW_MS);
  const reset = (recent[0] ?? now) + WINDOW_MS;
  if (recent.length >= LIMIT) {
    buckets.set(id, recent);
    return { ok: false, remaining: 0, reset };
  }
  recent.push(now);
  buckets.set(id, recent);
  return { ok: true, remaining: LIMIT - recent.length, reset };
}

export type ApiAuth =
  | { ok: true; key: ApiKeyRecord; remaining: number; reset: number }
  | { ok: false; response: Response };

// Keys are optional for now (JSN, Nov 21 2026): Tavus had trouble sending the header.
// Set to true to require a valid key again. Unkeyed callers share a per-IP rate limit.
const KEY_REQUIRED = false;
const ANON: ApiKeyRecord = { id: "anon", label: "anonymous", hash: "", created: "" };

function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

export function requireApiKey(req: Request): ApiAuth {
  const token = takeToken(req);
  const key = token ? matchKey(token) : null;
  if (!key && KEY_REQUIRED) return { ok: false, response: apiJson({ error: "Unauthorized" }, { status: 401 }) };
  const id = key ? key.id : `ip:${clientIp(req)}`;
  const rl = rateLimit(id);
  if (!rl.ok) return { ok: false, response: apiJson({ error: "Rate limit exceeded" }, { status: 429, remaining: 0, reset: rl.reset }) };
  return { ok: true, key: key ?? ANON, remaining: rl.remaining, reset: rl.reset };
}

export function withAuth(req: Request, handler: (auth: Extract<ApiAuth, { ok: true }>) => Response): Response {
  const auth = requireApiKey(req);
  if (!auth.ok) return auth.response;
  const res = handler(auth);
  return res;
}
