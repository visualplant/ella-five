import { publicWeek, json } from "@/lib/public";
import { weeks } from "@/lib/weekly";
export const dynamic = "force-static"; export const dynamicParams = false;
export function generateStaticParams() { return weeks().map((w) => ({ file: `${w}.json` })); }
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params; const w = publicWeek(file.replace(/\.json$/, ""));
  return w ? json(w) : new Response("Not found", { status: 404 });
}
