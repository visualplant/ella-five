"use client";
import { useEffect, useRef, useState } from "react";
import CatIcon from "@/components/CatIcon";
// Phones: tabs are anchor links into one vertically stacked page, with scroll-spy.
// Scrolling uses the browser's native smooth scroll (same easing/duration as the old horizontal swipe).
export default function Tabs({ items }: { items: { slug: string; name: string }[] }) {
  const [active, setActive] = useState(items[0].slug);
  const nav = useRef<HTMLElement>(null);
  const lock = useRef<string | null>(null);
  useEffect(() => {
    const spy = () => {
      const n = nav.current; if (!n || getComputedStyle(n).display === "none") return;
      const line = n.getBoundingClientRect().bottom + 24;
      let cur = items[0].slug;
      for (const i of items) { const el = document.getElementById(`col-${i.slug}`); if (el && el.getBoundingClientRect().top <= line) cur = i.slug; }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) cur = items[items.length - 1].slug;
      if (lock.current) { if (lock.current === cur) lock.current = null; else return; }
      setActive(cur);
    };
    spy();
    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", spy);
    const end = () => { lock.current = null; spy(); };
    window.addEventListener("scrollend", end);
    return () => { window.removeEventListener("scroll", spy); window.removeEventListener("resize", spy); window.removeEventListener("scrollend", end); };
  }, [items]);
  useEffect(() => {
    const n = nav.current, t = n?.querySelector<HTMLElement>(`[data-slug="${active}"]`);
    if (!n || !t) return;
    const l = t.offsetLeft - 14, r = t.offsetLeft + t.offsetWidth + 14 - n.clientWidth;
    if (n.scrollLeft > l) n.scrollTo({ left: l, behavior: "smooth" });
    else if (n.scrollLeft < r) n.scrollTo({ left: r, behavior: "smooth" });
  }, [active]);
  const go = (e: React.MouseEvent, slug: string) => {
    const el = document.getElementById(`col-${slug}`); if (!el) return;
    e.preventDefault();
    lock.current = slug; setActive(slug);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#col-${slug}`);
  };
  return (
    <nav className="tabs" aria-label="Lists" ref={nav}>
      {items.map((i) => <a key={i.slug} href={`#col-${i.slug}`} data-slug={i.slug} aria-current={active === i.slug ? "true" : undefined} onClick={(e) => go(e, i.slug)}><CatIcon slug={i.slug} />{i.name}</a>)}
    </nav>
  );
}
