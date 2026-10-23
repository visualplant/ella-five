import path from "path";
const root = path.dirname(new URL(import.meta.url).pathname);
export default {
  poweredByHeader: false, outputFileTracingRoot: root,
  webpack: (c) => { c.resolve.alias["@"] = root; return c; },
  // The default vertical (AI) lives at the root; /ai is an alias that points to the canonical root.
  async headers() { return [{ source: "/api/v1/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }, { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" }] }]; },
  async redirects() { return [{ source: "/ai", destination: "/", permanent: true }, { source: "/ai/:category", destination: "/:category", permanent: true }]; },
};
