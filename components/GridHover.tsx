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
    grid.addEventListener("mouseover", over); grid.addEventListener("mouseleave", leave);
    grid.addEventListener("focusin", over); grid.addEventListener("focusout", fout);
    return () => { grid.removeEventListener("mouseover", over); grid.removeEventListener("mouseleave", leave); grid.removeEventListener("focusin", over); grid.removeEventListener("focusout", fout); };
  }, []);
  return null;
}
