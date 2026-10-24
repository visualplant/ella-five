import { card, ogSize } from "@/lib/og";
import { loadRising } from "@/lib/rising";
export const size = ogSize;
export const contentType = "image/png";
export const alt = "Rising Stars – Ella – AI Talent Tracker";
export default function OG() {
  const r = loadRising();
  return card({
    eyebrow: "AI Talent Tracker",
    title: "Rising Stars",
    lines: [r.blurb],
  });
}
