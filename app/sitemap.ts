import type { MetadataRoute } from "next";
import { verticals, vpath } from "@/lib/verticals";
import { abs } from "@/lib/data";
export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = verticals.flatMap((v) => { const lm = new Date(v.updated);
    return [{ url: abs(vpath(v)), lastModified: lm, changeFrequency: "daily" as const, priority: 1 }, ...v.categories.map((c) => ({ url: abs(vpath(v, c.slug)), lastModified: lm, changeFrequency: "daily" as const, priority: 0.8 }))]; })
  ;
  out.push({ url: abs("/subscribe"), lastModified: new Date(verticals[0].updated), changeFrequency: "monthly", priority: 0.3 });
  return out;
}
