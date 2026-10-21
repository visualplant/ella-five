import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 }; export const contentType = "image/png"; export const alt = "Ella – AI Talent Tracker";
export default function OG() {
  return new ImageResponse(<div style={{ width: "100%", height: "100%", background: "#f6f3ee", color: "#2a2622", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 88 }}>
    <div style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase", color: "#8a7f72" }}>AI Talent Tracker</div>
    <div style={{ fontSize: 200, fontFamily: "serif", lineHeight: 1 }}>Ella</div>
    <div style={{ fontSize: 34, color: "#6b6258" }}>Technical · Design · Research · Product · Growth</div></div>, size);
}
