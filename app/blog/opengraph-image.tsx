import { card, ogSize } from "@/lib/og";
export const size = ogSize;
export const contentType = "image/png";
export const alt = "Blog – Ella – AI Talent Tracker";
export default function OG() {
  return card({ eyebrow: "Blog", title: "Notes on talent.", titleSize: 100, lines: ["Short observations from watching the lists."] });
}
