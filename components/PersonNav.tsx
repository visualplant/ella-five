"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
type N = { href: string; name: string; rank?: number };
const lab = (n: N) => n.rank == null ? n.name : `No. ${String(n.rank).padStart(2, "0")} ${n.name}`;
const Chev = ({ d }: { d: string }) => <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke"><path d={d} vectorEffect="non-scaling-stroke" /></svg>;
// Prev/next within the category (wrapping). Keys: ← prev, → next, Esc back to the grid.
export default function PersonNav({ prev, next }: { prev: N; next: N }) {
  const router = useRouter();
  useEffect(() => {
    router.prefetch(prev.href); router.prefetch(next.href);
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const t = document.activeElement as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|IFRAME)$/.test(t.tagName))) return;
      // Read targets from the rendered links so a key pressed mid-navigation never uses stale props.
      const links = document.querySelectorAll<HTMLAnchorElement>(".pv-nav .pv-nb");
      if (e.key === "ArrowLeft" && links[0]) { e.preventDefault(); router.push(links[0].getAttribute("href")!); }
      else if (e.key === "ArrowRight" && links[1]) { e.preventDefault(); router.push(links[1].getAttribute("href")!); }
      else if (e.key === "Escape") { e.preventDefault(); router.push("/"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prev.href, next.href]);
  return <span className="pv-nav">
    <Link href={prev.href} className="pv-nb" aria-label={`Previous: ${lab(prev)}`}><Chev d="M15 4.5 7.5 12l7.5 7.5" /><span className="pv-tip" aria-hidden="true">{lab(prev)}</span></Link>
    <Link href={next.href} className="pv-nb" aria-label={`Next: ${lab(next)}`}><Chev d="M9 4.5 16.5 12 9 19.5" /><span className="pv-tip" aria-hidden="true">{lab(next)}</span></Link>
  </span>;
}
