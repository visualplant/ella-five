import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Board from "@/components/Board";
import { abs } from "@/lib/data";
import { weeks, getWeek } from "@/lib/weekly";
import { archiveWeekDescription, archiveWeekTitle } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() { const w = weeks(); return w.map((week) => ({ week })); }
export async function generateMetadata({ params }: { params: Promise<{ week: string }> }): Promise<Metadata> {
  const { week } = await params;
  const v = getWeek(week);
  const title = archiveWeekTitle(week);
  const description = v ? archiveWeekDescription(v, week) : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/archive/${week}` },
    openGraph: { type: "website", url: abs(`/archive/${week}`), title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}
export default async function Week({ params }: { params: Promise<{ week: string }> }) {
  const { week } = await params; const v = getWeek(week); if (!v) notFound();
  return <Board v={v} week={week} />;
}
