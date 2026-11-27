// Ella 5x5 badge artwork, ported from the Figma frames (file 9i3Jh29FKfVXG24ueJ1EdR,
// light 4079:771, dark 4079:841). Geometry, fades and stroke weights follow the file exactly;
// icons are the site's Lucide icons (components/CatIcon.tsx) at 12px; type is outlined Inter Medium.
import { LUCIDE_SVG } from "@/components/CatIcon";
import { LABEL_PATHS, RANK_PATHS } from "@/lib/badge-art";
import { BADGE_HEIGHT, BADGE_WIDTHS, pad2, type BadgeTheme } from "@/lib/badge";

type Stop = [number, string, number?]; // offset, color, opacity
const K = "#000000", C = "#F5EDE8";
const fade = (a: number, b: number, col = K): Stop[] => [[0, col, 0], [a, col], [b, col], [1, col, 0]];

// Light frame: fades were left as designed, so stops differ per row (Design's left line uses mid-greys).
const LIGHT: Record<string, { v: Stop[]; vl?: Stop[]; h: Stop[] }> = {
  design: { v: fade(0.177885, 0.8125), vl: [[0, K, 0], [0.177885, "#0D0D0D"], [0.8125, "#1A1A1A"], [1, K, 0]], h: fade(0.115385, 0.884615) },
  technical: { v: fade(0.206731, 0.769231), h: fade(0.115385, 0.884615) },
  product: { v: fade(0.240385, 0.774038), h: fade(0.158654, 0.860577) },
  research: { v: fade(0.211538, 0.783654), h: fade(0.158654, 0.860577) },
  growth: { v: fade(0.25, 0.774038), h: fade(0.182692, 0.841346) },
};
const DARK = { v: fade(0.211538, 0.721154, C), h: fade(0.168269, 0.826923, C) };

// Icon stroke weights in the file (12px icon units). Not uniform, by design.
const ICON_STROKE: Record<string, number> = { technical: 1.37143, design: 1, product: 1, research: 1.06667, growth: 0.938824 };

const GEO = {
  light: { h: 33, cell: [28, 6, 32, 21], fill: "#F5F3EF", horiz: [[23, 6.5, 65], [23, 27.5, 65]], verts: [27.5, 59.75], dy: 0 },
  dark: { h: 39, cell: [28, 9, 32, 21], fill: C, horiz: [[21, 9.5, 67], [21, 30.5, 67]], verts: [27.63, 59.625], dy: 3 },
} as const;

const stops = (s: Stop[]) => s.map(([o, c, op]) => `<stop offset="${o}"${c !== K ? ` stop-color="${c}"` : ""}${op !== undefined ? ` stop-opacity="${op}"` : ""}/>`).join("");
const lucideInner = (slug: string) => (LUCIDE_SVG[slug] || "").replace(/^<svg[^>]*>\s*/, "").replace(/\s*<\/svg>\s*$/, "");

export function badgeSvg(category: string, rank: number, theme: BadgeTheme, title: string): string {
  const code = pad2(rank);
  const width = BADGE_WIDTHS[category];
  if (!width || !RANK_PATHS[code] || !LABEL_PATHS[category]) throw new Error(`no badge for ${category} ${rank}`);
  const g = GEO[theme];
  const ink = theme === "light" ? K : C;
  const grad: { v: Stop[]; vl?: Stop[]; h: Stop[] } = theme === "light" ? LIGHT[category] : DARK;
  const vl: Stop[] = grad.vl ?? grad.v;
  const [cx, cy, cw, ch] = g.cell;
  // Light artwork is 33px tall; it sits centered in the shared 39px slot (cells line up across themes).
  const top = theme === "light" ? -(BADGE_HEIGHT - g.h) / 2 : 0;
  const t = g.dy ? ` transform="translate(0 ${g.dy})"` : "";
  const id = (k: string) => `${k}-${theme}-${category}-${code}`;
  const clip = category === "research";
  const sw = ICON_STROKE[category] * 2; // Lucide paths are 24-unit; drawn at 0.5 scale
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${BADGE_HEIGHT}" viewBox="0 ${top} ${width} ${BADGE_HEIGHT}" fill="none" role="img" aria-label="${title}">`,
    `<title>${title}</title>`,
    `<defs>`,
    `<linearGradient id="${id("vr")}" x1="${g.verts[1] - 1}" y1="0" x2="${g.verts[1] - 1}" y2="${g.h}" gradientUnits="userSpaceOnUse">${stops(grad.v)}</linearGradient>`,
    `<linearGradient id="${id("vl")}" x1="${g.verts[0] - 1}" y1="0" x2="${g.verts[0] - 1}" y2="${g.h}" gradientUnits="userSpaceOnUse">${stops(vl)}</linearGradient>`,
    ...g.horiz.map(([x1, y, x2], i) => `<linearGradient id="${id("h" + i)}" x1="${x1}" y1="${y + 0.5}" x2="${x2}" y2="${y + 0.5}" gradientUnits="userSpaceOnUse">${stops(grad.h)}</linearGradient>`),
    clip ? `<clipPath id="${id("clip")}"><rect x="38" y="10.5" width="12" height="12"/></clipPath>` : "",
    `</defs>`,
    `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="${g.fill}"/>`,
    `<line x1="${g.verts[1]}" y1="0" x2="${g.verts[1]}" y2="${g.h}" stroke="url(#${id("vr")})"/>`,
    ...g.horiz.map(([x1, y, x2], i) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="url(#${id("h" + i)})"/>`),
    `<line x1="${g.verts[0]}" y1="0" x2="${g.verts[0]}" y2="${g.h}" stroke="url(#${id("vl")})"/>`,
    `<g${t} fill="${ink}"><path d="${RANK_PATHS[code]}"/><path d="${LABEL_PATHS[category]}"/></g>`,
    `<g${t}><g${clip ? ` clip-path="url(#${id("clip")})"` : ""}><g transform="translate(38 10.5) scale(.5)" fill="none" stroke="#000" stroke-width="${+sw.toFixed(5)}" stroke-linecap="round" stroke-linejoin="round">${lucideInner(category)}</g></g></g>`,
    `</svg>`,
  ].join("\n");
}
