import Link from "next/link";
import { weeks, weekLabel } from "@/lib/weekly";
export const metadata = { title: "Archive", alternates: { canonical: "/archive" } };
export default function Archive() {
  const w = weeks();
  return (
    <section className="hero wrap compact">
      <p className="ar-week">Archive</p>
      <p className="lede">Earlier editions of the lists, as they stood when published.</p>
      {w.length ? <ol className="ar-list">{w.map((d) => <li key={d}><Link href={`/archive/${d}`}>{weekLabel(d)}</Link></li>)}</ol> : <p className="lede small">No earlier editions yet.</p>}
    </section>
  );
}
