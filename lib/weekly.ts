// Weekly archive: Ella saves each Monday's lists to /workspace/ella/weekly/YYYY-MM-DD.json;
// scripts/sync-weekly.sh copies them into data/weekly/ (committed) so builds from git archive include them.
import fs from "node:fs";
import path from "node:path";
import type { Vertical } from "@/lib/verticals";
const DIR = path.join(process.cwd(), "data", "weekly");
export const weeks = (): string[] => { try { return fs.readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map((f) => f.slice(0, 10)).sort().reverse(); } catch { return []; } };
export const getWeek = (d: string): Vertical | null => { try { return JSON.parse(fs.readFileSync(path.join(DIR, d + ".json"), "utf8")); } catch { return null; } };
export const weekLabel = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
