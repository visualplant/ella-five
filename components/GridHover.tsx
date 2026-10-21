"use client";
import { useEffect } from "react";
// Bullseye: mark each cell with its Chebyshev distance from the hovered/focused cell.
export default function GridHover() {
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>(".cols");
    if (!grid) return;
    const cells = [...grid.querySelectorAll<HTMLElement>("[data-row]")];
    const big = window.matchMedia("(min-width: 1280px)");
    let cur: HTMLElement | null = null;
    const set = (t: EventTarget | null) => {
      const cell = (t as HTMLElement | null)?.closest?.<HTMLElement>("[data-row]") ?? null;
      if (cell === cur) return;
      cur = cell;
      if (!cell || !big.matches) { delete grid.dataset.active; cells.forEach((c) => delete c.dataset.d); return; }
      const r = +cell.dataset.row!, k = +cell.dataset.col!;
      grid.dataset.active = "";
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
