import Link from "next/link";
import type { Metadata } from "next";
import { abs } from "@/lib/data";
import { weeks, weekLabel } from "@/lib/weekly";
import { ARCHIVE_INDEX_DESCRIPTION, ARCHIVE_INDEX_H1, archiveIndexTitle, ROOT_OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: archiveIndexTitle() },
  description: ARCHIVE_INDEX_DESCRIPTION,
  alternates: { canonical: "/archive" },
  openGraph: { type: "website", url: abs("/archive"), title: archiveIndexTitle(), description: ARCHIVE_INDEX_DESCRIPTION, images: [ROOT_OG_IMAGE] },
  twitter: { card: "summary_large_image", title: archiveIndexTitle(), description: ARCHIVE_INDEX_DESCRIPTION },
};

export default function Archive() {
  const w = weeks();
  return (
    <section className="hero wrap compact">
      <h1 className="ar-week">{ARCHIVE_INDEX_H1}</h1>
      <p className="lede">Earlier editions of the lists, as they stood when published.</p>
      {w.length ? <ol className="ar-list">{w.map((d) => <li key={d}><Link href={`/archive/${d}`}>{weekLabel(d)}</Link></li>)}</ol> : <p className="lede small">No earlier editions yet.</p>}
    </section>
  );
}
