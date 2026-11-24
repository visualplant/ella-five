import path from "path";
const root = path.dirname(new URL(import.meta.url).pathname);
export default {
  poweredByHeader: false, outputFileTracingRoot: root,
  // Content is read with fs at request time (root layout, dynamic pages like /confirm).
  // Trace it into every serverless function so it exists on /var/task.
  outputFileTracingIncludes: { "/**": ["./content/**/*", "./data/**/*"] },
  webpack: (c) => { c.resolve.alias["@"] = root; return c; },
  // The default vertical (AI) lives at the root; /ai is an alias that points to the canonical root.
  async headers() { return [{ source: "/api/v1/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }, { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" }, { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type" }] }]; },
  async redirects() {
    return [
      { source: "/ai", destination: "/", permanent: true },
      { source: "/ai/:category", destination: "/:category", permanent: true },
      { source: "/rising", destination: "/rising-stars", permanent: false },
      { source: "/archive/2026-10-20", destination: "/archive/2026-10-19", permanent: false },
    ];
  },
};
