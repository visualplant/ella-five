const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");

export type SourceChild = {
  href: string;
  label: string;
};

export type SourceGroup = {
  key: string;
  label: string;
  href: string;
  children: SourceChild[];
};

const WORD_OVERRIDES: Record<string, string> = {
  ai: "AI",
  ux: "UX",
  ui: "UI",
  api: "API",
  sdk: "SDK",
  llm: "LLM",
  llms: "LLMs",
  rl: "RL",
  mpp: "MPP",
  ucp: "UCP",
  oplabs: "OP Labs",
  rothys: "Rothy’s",
  sayhi: "Say Hi",
  openai: "OpenAI",
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  coinbase: "Coinbase",
  xbox: "Xbox",
  im: "I’m",
  ive: "I’ve",
  weve: "We’ve",
  couldnt: "Couldn’t",
  "93b": "$9.3B",
  pdf: "",
  html: "",
};

const SMALL_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "to",
  "in",
  "on",
  "of",
  "at",
  "by",
  "with",
  "into",
  "as",
]);

function titleWords(slug: string, maxWords = 5): string {
  const raw = slug
    .replace(/\.(html?|pdf|php|aspx?)$/i, "")
    .split(/[-_]+/)
    .filter(Boolean);
  if (!raw.length) return "";
  const trimmed = raw.slice(0, maxWords);
  const words = trimmed
    .map((w, i) => {
      const low = w.toLowerCase();
      if (low in WORD_OVERRIDES) return WORD_OVERRIDES[low];
      if (i > 0 && SMALL_WORDS.has(low)) return low;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .filter(Boolean);
  return words.join(" ") + (raw.length > maxWords ? "…" : "");
}

export function subSourceLabel(u: string): string | null {
  try {
    const url = new URL(u);
    const h = url.hostname.replace(/^www\./, "").toLowerCase();
    const segs = url.pathname.split("/").filter(Boolean);
    if (!segs.length && !url.search) return null;

    if (h.includes("linkedin.com")) {
      if (segs[0] === "in") return "Profile";
      if (segs[0] === "posts" && segs[1]) {
        const m = segs[1].match(/^[^_]+_(.+?)-activity-\d+/);
        if (m && m[1]) {
          return "Post: " + titleWords(m[1], 5);
        }
        return "Post";
      }
      if (segs[0] === "feed") return "Post";
    }

    if (h === "arxiv.org" && segs[0] === "abs" && segs[1]) {
      return "arXiv:" + segs[1];
    }

    if (h === "github.com") {
      if (segs.length === 1) return "@" + segs[0];
      if (segs.length >= 2) return segs[0] + "/" + segs[1];
    }

    if (h === "x.com" || h === "twitter.com") {
      if (segs.length === 1) return "@" + segs[0];
      if (segs[2] === "status") return "@" + segs[0] + " post";
    }

    let last = segs[segs.length - 1] || "";
    const prev = segs.length > 1 ? segs[segs.length - 2] : "";
    if (url.searchParams.has("page") && segs.length === 1) {
      return titleWords(last, 4) + " (p. " + url.searchParams.get("page") + ")";
    }
    last = last.replace(/-\d{4}-\d{2}(-\d{2})?$/, "");
    if (prev === "people") return "Profile";
    return titleWords(last, 5) || url.pathname;
  } catch {
    return u;
  }
}

export function groupSources(sources: string[]): SourceGroup[] {
  const unique: string[] = [];
  const seenUrl = new Set<string>();
  for (const s of sources || []) {
    const trimmed = s.trim();
    if (!trimmed) continue;
    const norm = trimmed.replace(/\/$/, "");
    if (!seenUrl.has(norm)) {
      seenUrl.add(norm);
      unique.push(trimmed);
    }
  }

  const groups = new Map<string, { key: string; label: string; urls: string[] }>();
  for (const s of unique) {
    const h = host(s);
    const isLI = /linkedin\.com/i.test(h);
    const key = isLI ? "linkedin.com" : h.toLowerCase();
    const label = isLI ? "LinkedIn" : h;
    if (!groups.has(key)) {
      groups.set(key, { key, label, urls: [] });
    }
    groups.get(key)!.urls.push(s);
  }

  const out: SourceGroup[] = [];
  for (const g of groups.values()) {
    if (g.urls.length === 1) {
      out.push({ key: g.key, label: g.label, href: g.urls[0], children: [] });
      continue;
    }

    const rootIdx = g.urls.findIndex((u) => {
      try {
        const parsed = new URL(u);
        return (parsed.pathname === "/" || parsed.pathname === "") && !parsed.search;
      } catch {
        return false;
      }
    });

    let rootHref: string;
    let childUrls: string[];

    if (rootIdx !== -1) {
      rootHref = g.urls[rootIdx];
      childUrls = g.urls.filter((_, idx) => idx !== rootIdx);
    } else {
      const profUrl =
        g.key === "linkedin.com"
          ? g.urls.find((u) => {
              try {
                return new URL(u).pathname.startsWith("/in/");
              } catch {
                return false;
              }
            })
          : undefined;
      rootHref = profUrl || `https://${g.key}`;
      childUrls = [...g.urls];
      if (g.key === "linkedin.com") {
        childUrls.sort((a, b) => {
          const aProf = new URL(a).pathname.startsWith("/in/") ? 0 : 1;
          const bProf = new URL(b).pathname.startsWith("/in/") ? 0 : 1;
          return aProf - bProf;
        });
      }
    }

    const children = childUrls.map((u) => ({
      href: u,
      label: subSourceLabel(u) || g.label,
    }));

    out.push({ key: g.key, label: g.label, href: rootHref, children });
  }

  return out;
}

/** Deduplicate sources by host for compact one-line summary views (category rows, rising stars). */
export function dedupeSourcesByHost(sources: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of sources || []) {
    try {
      const h = host(s).toLowerCase();
      const key = h.includes("linkedin.com") ? "linkedin.com" : h;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    } catch {
      out.push(s);
    }
  }
  return out;
}
