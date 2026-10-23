import { publicPeople, json } from "@/lib/public";
import { SITE } from "@/lib/data";
export const dynamic = "force-static";
export function GET() { return json({ people: publicPeople().map((p) => ({ slug: p.slug, name: p.name, category: p.category, role: p.role, org: p.org, location: p.location, onCurrentList: p.onCurrentList, profileUrl: p.profileUrl, json: `${SITE}/api/v1/people/${p.slug}.json` })) }); }
