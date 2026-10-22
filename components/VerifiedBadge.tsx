"use client";
import { useEffect, useId, useRef, useState } from "react";
// Calm "Verified" pill; click opens a small popover explaining how. Esc / click-outside close it.
// Esc is handled in the capture phase and marked handled, so the page's Esc-to-grid shortcut waits.
export default function VerifiedBadge({ how }: { how?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId(), wrap = useRef<HTMLSpanElement>(null), btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); btn.current?.focus(); } };
    const down = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", key, true); document.addEventListener("pointerdown", down);
    return () => { window.removeEventListener("keydown", key, true); document.removeEventListener("pointerdown", down); };
  }, [open]);
  return (
    <span className="vb" ref={wrap}>
      <button ref={btn} type="button" className="vb-pill" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 16 16" width="9" height="9" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5 6.5 11.5 12.5 4.5" /></svg><span className="vb-t">Verified</span>
      </button>
      <span id={id} role="dialog" aria-label="How this was verified" className="vb-pop" hidden={!open}>{how || "Verified by Ella from public sources."}</span>
    </span>
  );
}
