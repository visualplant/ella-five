import { publicPerson, json } from "@/lib/public";
import { people } from "@/lib/people";
export const dynamic = "force-static"; export const dynamicParams = false;
export function generateStaticParams() { return [...people().keys()].map((s) => ({ file: `${s}.json` })); }
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params; const e = people().get(file.replace(/\.json$/, ""));
  return e ? json(publicPerson(e)) : new Response("Not found", { status: 404 });
}
