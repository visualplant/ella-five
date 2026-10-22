import type { MetadataRoute } from "next";
import { verticals, vpath } from "@/lib/verticals";
import { abs } from "@/lib/data";
import { weeks } from "@/lib/weekly";
import { people } from "@/lib/people";
export default function sitemap(): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = verticals.flatMap((v) => { const lm = new Date(v.updated);
    return [{ url: abs(vpath(v)), lastModified: lm, changeFrequency: "daily" as const, priority: 1 }, ...v.categories.map((c) => ({ url: abs(vpath(v, c.slug)), lastModified: lm, changeFrequency: "daily" as const, priority: 0.8 }))]; })
  ;
  out.push({ url: abs("/subscribe"), lastModified: new Date(verticals[0].updated), changeFrequency: "monthly", priority: 0.3 });
  out.push({ url: abs("/about"), lastModified: new Date(verticals[0].updated), changeFrequency: "monthly", priority: 0.4 });
  for (const u of ["/lists.json", "/llms.txt", "/llms-full.txt"]) out.push({ url: abs(u), lastModified: new Date(verticals[0].updated), changeFrequency: "daily", priority: 0.3 });
  const w = weeks(); if (w.length) { out.push({ url: abs("/archive"), lastModified: new Date(w[0] + "T12:00:00Z"), changeFrequency: "weekly", priority: 0.3 }); for (const d of w) out.push({ url: abs(`/archive/${d}`), lastModified: new Date(d + "T12:00:00Z"), changeFrequency: "yearly", priority: 0.2 }); }
  for (const e of people().values()) out.push({ url: abs(`/${e.home}/${e.slug}`), lastModified: new Date(e.current ? verticals[0].updated : e.appeared[0] + "T12:00:00Z"), changeFrequency: "monthly", priority: e.current ? 0.6 : 0.3 });
  return out;
}
