"use client";
import { useEffect } from "react";
// Bullseye: mark each cell with its Chebyshev distance from the hovered/focused cell.
export default function GridHover() {
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".cols");
    if (!grid) return;
    const cells = [...grid.querySelectorAll<HTMLElement>("[data-row]")];
    const big = window.matchMedia("(min-width: 701px)");
    let cur: HTMLElement | null = null;
    const set = (t: EventTarget | null) => {
      const cell = (t as HTMLElement | null)?.closest?.<HTMLElement>("[data-row]") ?? null;
      if (cell === cur) return;
      cur = cell;
      grid.querySelectorAll<HTMLElement>("[data-rail]").forEach((n) => { if (cell && big.matches && n.dataset.rail === cell.dataset.row) n.dataset.on = ""; else delete n.dataset.on; });
      grid.querySelectorAll<HTMLElement>("section.col").forEach((sc, i) => { if (cell && big.matches && String(i + 1) === cell.dataset.col) sc.dataset.on = ""; else delete sc.dataset.on; });
      if (!cell || !big.matches) { delete grid.dataset.active; cells.forEach((c) => delete c.dataset.d); return; }
      const r = +cell.dataset.row!, k = +cell.dataset.col!;
      grid.dataset.active = "";
      const rays = grid.querySelector<HTMLElement>(".rays");
      if (rays) {
        const g = grid.getBoundingClientRect(), f = cells[0].getBoundingClientRect(), l = cells[cells.length - 1].getBoundingClientRect(), c = cell.getBoundingClientRect();
        // Edge/corner cells: lines continue past the grid edge and fade out (Figma: 70px vertical, 65px horizontal),
        // Left/top may spill freely (negative overflow never scrolls); right/bottom are clamped to the
        // document's existing scroll size so the hover never adds a scrollbar.
        const last = (a: string) => Math.max(...cells.map((x) => +x.dataset[a as "row"]!));
        const EX = 65, EY = 70;
        const de = document.documentElement, maxR = de.scrollWidth - window.scrollX - 1, maxB = de.scrollHeight - window.scrollY - 1;
        const eL = k === 1 ? EX : 0, eR = k === last("col") ? Math.max(0, Math.min(EX, maxR - l.right)) : 0;
        const eT = r === 1 ? EY : 0, eB = r === last("row") ? Math.max(0, Math.min(EY, maxB - l.bottom)) : 0;
        const L = f.left - g.left - eL, T = f.top - g.top - eT, W = l.right - f.left + eL + eR, H = l.bottom - f.top + eT + eB;
        Object.assign(rays.style, { left: L - 1 + "px", top: T - 1 + "px", width: W + 1 + "px", height: H + 1 + "px" });
        const v = { x1: c.left - f.left + eL, x2: c.right - f.left + eL, y1: c.top - f.top + eT, y2: c.bottom - f.top + eT };
        Object.entries(v).forEach(([k, n]) => rays.style.setProperty("--" + k, n + "px"));
      }
      cells.forEach((c) => { c.dataset.d = String(Math.max(Math.abs(+c.dataset.row! - r), Math.abs(+c.dataset.col! - k))); });
    };
    const over = (e: Event) => set(e.target);
    const leave = () => set(null);
    const fout = (e: FocusEvent) => { if (!grid.contains(e.relatedTarget as Node)) set(null); };
    // Intro "disco floor": a simulated pointer sweeps ~14 distinct cells (~0.5s), lands on one person, holds, then fades out.
    // Drives the same set() as real hover; aborts on any real input. Large pointer layout only; skipped for reduced motion.
    const timers: number[] = [];
    let hot: HTMLElement | null = null;
    const mark = (c: HTMLElement | null) => { if (hot) delete hot.dataset.hot; hot = c; if (c) c.dataset.hot = ""; };
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    const stop = (e?: Event) => {
      if (!timers.length && !grid.dataset.fade) return;
      timers.forEach(clearTimeout); timers.length = 0; offs.forEach((f) => f());
      // Cut transitions for one frame so the pinned/fading cell clears instantly and real hover is crisp.
      grid.dataset.cut = ""; requestAnimationFrame(() => requestAnimationFrame(() => delete grid.dataset.cut));
      delete grid.dataset.fade; delete grid.dataset.intro; grid.querySelector<HTMLElement>("[data-last]")?.removeAttribute("data-last"); mark(null);
      set(e && e.type === "pointermove" && grid.contains(e.target as Node) ? e.target : null);
    };
    const evs: [EventTarget, string][] = [[grid, "pointermove"], [window, "keydown"], [window, "wheel"], [window, "scroll"], [window, "touchstart"], [document, "focusin"], [window, "pointerdown"]];
    const offs = evs.map(([t, n]) => { t.addEventListener(n, stop, { passive: true, capture: true }); return () => t.removeEventListener(n, stop, true); });
    if (big.matches && matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const at = (r: number, k: number) => cells.find((c) => +c.dataset.row! === r && +c.dataset.col! === k)!;
      const R = Math.max(...cells.map((c) => +c.dataset.row!)), K = Math.max(...cells.map((c) => +c.dataset.col!));
      let prevLand = ""; try { prevLand = sessionStorage.getItem("ella-intro") || ""; } catch {}
      const pool = cells.filter((c) => c.dataset.row + "," + c.dataset.col !== prevLand);
      const land = pool[Math.floor(Math.random() * pool.length)];
      try { sessionStorage.setItem("ella-intro", land.dataset.row + "," + land.dataset.col); } catch {}
      // Self-avoiding sweep: walk backwards from the landing cell through unvisited cells (mostly adjacent,
      // diagonals allowed, keeping direction when possible; nearest unvisited if stuck), then play it forwards.
      const key = (c: HTMLElement) => [+c.dataset.row!, +c.dataset.col!];
      const seen = new Set([land]); const path = [land]; let dr = 0, dk = 0;
      while (path.length < 14) {
        const [r, k] = key(path[path.length - 1]);
        const free = cells.filter((c) => !seen.has(c));
        if (!free.length) break;
        const dist = (c: HTMLElement) => { const [a, b] = key(c); return Math.max(Math.abs(a - r), Math.abs(b - k)); };
        const near = free.filter((c) => dist(c) === 1);
        const opts = near.length ? near : free.filter((c) => dist(c) === Math.min(...free.map(dist)));
        const score = (c: HTMLElement) => { const [a, b] = key(c); return (a - r) * dr + (b - k) * dk + Math.random() * 1.5; };
        const nx = opts.reduce((m, c) => (score(c) > score(m) ? c : m));
        const [a, b] = key(nx); dr = a - r; dk = b - k; seen.add(nx); path.push(nx);
      }
      path.reverse();
      const HOP = 36;
      let ms = 250;
      requestAnimationFrame(() => {
        grid.dataset.intro = "";
        path.forEach((c) => { later(() => { mark(c); set(c); }, ms); ms += HOP; });
        ms -= HOP;
        later(() => { delete grid.dataset.intro; grid.dataset.fade = ""; land.dataset.last = ""; mark(null); set(null); }, ms + 4000);
        later(() => { delete grid.dataset.fade; delete land.dataset.last; timers.length = 0; offs.forEach((f) => f()); }, ms + 4000 + 1100);
      });
    } else offs.forEach((f) => f());
    grid.addEventListener("mouseover", over); grid.addEventListener("mouseleave", leave);
    grid.addEventListener("focusin", over); grid.addEventListener("focusout", fout);
    return () => { timers.forEach(clearTimeout); offs.forEach((f) => f()); grid.removeEventListener("mouseover", over); grid.removeEventListener("mouseleave", leave); grid.removeEventListener("focusin", over); grid.removeEventListener("focusout", fout); };
  }, []);
  return null;
}
