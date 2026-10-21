import { NextResponse } from "next/server";
import { categories } from "@/lib/data";
import { enabled, sendConfirm } from "@/lib/resend";

const valid = new Set(categories.map((c) => c.slug));
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const email = String(b?.email || "").trim().toLowerCase();
  const cats: string[] = Array.isArray(b?.categories) ? [...new Set<string>(b.categories)].filter((c) => valid.has(c)) : [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
  if (!cats.length) return NextResponse.json({ message: "Choose at least one list." }, { status: 400 });
  if (!enabled()) return NextResponse.json({ message: "Subscriptions open soon. Thank you for your interest." }, { status: 503 });
  const names = categories.filter((c) => cats.includes(c.slug)).map((c) => c.name).join(", ");
  // Nothing is stored until the signed confirm link is clicked (double opt-in).
  const ok = await sendConfirm(email, cats, names);
  return ok ? NextResponse.json({ message: "Thank you. Check your inbox to confirm." }) : NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 502 });
}
