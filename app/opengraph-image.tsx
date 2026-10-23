import { card, ogSize } from "@/lib/og";
import { defaultVertical } from "@/lib/verticals";
export const size = ogSize; export const contentType = "image/png"; export const alt = "Ella – AI Talent Tracker";
export default function OG() { return card({ eyebrow: "AI Talent Tracker", title: "Obsessed with human talent.", titleSize: 92, lines: [defaultVertical.categories.map((c) => c.name).join(" · ")], foot: "Every status sourced · ellafive.com" }); }
