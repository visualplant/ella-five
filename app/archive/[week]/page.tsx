import { notFound } from "next/navigation";
import Board from "@/components/Board";
import { weeks, getWeek, weekLabel } from "@/lib/weekly";
export const dynamicParams = false;
export function generateStaticParams() { const w = weeks(); return w.map((week) => ({ week })); }
export async function generateMetadata({ params }: { params: Promise<{ week: string }> }) { const { week } = await params; return { title: `Lists from ${weekLabel(week)}`, alternates: { canonical: `/archive/${week}` } }; }
export default async function Week({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params; const v = getWeek(week); if (!v) notFound();
  return <Board v={v} week={week} />;
}
