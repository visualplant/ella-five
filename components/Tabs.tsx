"use client";
import { useEffect, useState } from "react";
export default function Tabs({ items }: { items: { slug: string; name: string }[] }) {
  const [active, setActive] = useState(items[0].slug);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id.replace("col-", ""))), { threshold: 0.6 });
    items.forEach((i) => { const el = document.getElementById(`col-${i.slug}`); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [items]);
  const go = (slug: string) => document.getElementById(`col-${slug}`)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  return (
    <nav className="tabs" aria-label="Lists">
      {items.map((i) => <button key={i.slug} type="button" aria-current={active === i.slug} onClick={() => go(i.slug)}>{i.name}</button>)}
    </nav>
  );
}
