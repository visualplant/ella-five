"use client";
import { useState } from "react";
import type { Person } from "@/lib/verticals";
// Calm, privacy-friendly media: YouTube loads only on click (youtube-nocookie); images lazy-load.
export default function PersonMedia({ m, name }: { m: NonNullable<Person["media"]>; name: string }) {
  const [on, setOn] = useState(false);
  const cap = (m.caption || m.credit) && <figcaption>{m.caption}{m.credit && <span> · {m.credit}</span>}</figcaption>;
  if (m.type === "youtube" && m.id) return <figure className="pv-fig"><div className="pv-media">
    {on ? <iframe src={`https://www.youtube-nocookie.com/embed/${m.id}?autoplay=1&rel=0`} title={m.caption || `Video of ${name}`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
      : <button type="button" className="pv-play" onClick={() => setOn(true)} aria-label={`Play video: ${m.caption || name}`}>
          <img src={`https://i.ytimg.com/vi/${m.id}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="pv-pbtn" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor" /></svg></span>
        </button>}
  </div>{cap}</figure>;
  if (m.type === "image" && m.url) return <figure className="pv-fig"><div className={`pv-media${/\.svg($|\?)/i.test(m.url) ? " pv-contain" : ""}`}><img src={m.url} alt={m.alt || m.caption || name} loading="lazy" /></div>{cap}</figure>;
  return null;
}
