import { publicWeeks, json } from "@/lib/public";
import { SITE } from "@/lib/data";
export const dynamic = "force-static";
export function GET() { return json({ weeks: publicWeeks(), people: `${SITE}/api/v1/people.json` }); }
