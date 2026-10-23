// Shared share-image (OG) design: warm off-white, serif names, small tracked sans labels, Ella wordmark.
import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
export const ogSize = { width: 1200, height: 630 };
const F = (f: string) => fs.readFileSync(path.join(process.cwd(), "assets", "fonts", f));
const fonts = () => [
  { name: "Newsreader", data: F("Newsreader-Light.ttf"), weight: 300 as const, style: "normal" as const },
  { name: "Newsreader", data: F("Newsreader-Italic.ttf"), weight: 400 as const, style: "italic" as const },
  { name: "Inter", data: F("Inter-Regular.ttf"), weight: 400 as const, style: "normal" as const },
  { name: "Inter", data: F("Inter-Medium.ttf"), weight: 500 as const, style: "normal" as const },
];
const C = { bg: "#f6f3ee", ink: "#2a2622", soft: "#6b6258", mute: "#9a8f82", line: "#e4ddd2" };
const label = { fontFamily: "Inter", fontWeight: 500, fontSize: 22, letterSpacing: 4, textTransform: "uppercase" as const, color: C.mute };
export function card({ eyebrow, title, lines = [], foot, titleSize = 108 }: { eyebrow: string; title: string; lines?: string[]; foot?: string; titleSize?: number }) {
  const t = title.length > 34 ? Math.round(titleSize * 0.72) : title.length > 22 ? Math.round(titleSize * 0.86) : titleSize;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", background: C.bg, color: C.ink, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 88px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "Newsreader", fontStyle: "italic", fontSize: 52, lineHeight: 1 }}>Ella</div>
        <div style={label}>{eyebrow}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "Newsreader", fontWeight: 300, fontSize: t, lineHeight: 1.04, letterSpacing: -2, maxWidth: 1020 }}>{title}</div>
        {lines.map((l, i) => <div key={i} style={{ fontFamily: "Inter", fontSize: 32, color: i ? C.mute : C.soft, marginTop: i ? 10 : 30, maxWidth: 1020, lineHeight: 1.3 }}>{l}</div>)}
      </div>
      <div style={{ display: "flex", borderTop: `1px solid ${C.line}`, paddingTop: 26, ...label, fontSize: 18 }}>{foot ?? "AI Talent Tracker · ellafive.com"}</div>
    </div>, { ...ogSize, fonts: fonts() });
}
