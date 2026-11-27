// Static Ella 5x5 badges: /badge/{YYYY-MM-DD}/{category}/{rank:02}-{light|dark}.svg
// One file per list appearance and theme, generated at build time from data/weekly.
import { allAppearances } from "@/lib/badge-data";
import { badgeSvg } from "@/lib/badge-svg";
import { badgeTitle, pad2, type BadgeTheme } from "@/lib/badge";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return allAppearances().flatMap((a) => (["light", "dark"] as const).map((t) => ({ week: a.week, category: a.category, file: `${pad2(a.rank)}-${t}.svg` })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ week: string; category: string; file: string }> }) {
  const { week, category, file } = await params;
  const m = /^(0[1-5])-(light|dark)\.svg$/.exec(file);
  const a = m && allAppearances().find((x) => x.week === week && x.category === category && x.rank === Number(m[1]));
  if (!m || !a) return new Response("Not found", { status: 404 });
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return new Response(badgeSvg(category, a.rank, m[2] as BadgeTheme, esc(badgeTitle(a))), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800",
      "X-Robots-Tag": "noindex",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
