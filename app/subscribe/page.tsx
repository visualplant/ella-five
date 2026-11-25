import type { Metadata } from "next";
import { abs, categories } from "@/lib/data";
import SubscribeForm from "@/components/SubscribeForm";
import { ROOT_OG_IMAGE } from "@/lib/seo";

const title = "Subscribe";
const full = "Subscribe – Ella – AI Talent Tracker";
const description = "Choose one or more disciplines. We will ask you to confirm by email first.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", url: abs("/subscribe"), title: full, description, images: [ROOT_OG_IMAGE] },
  twitter: { card: "summary_large_image", title: full, description },
  alternates: { canonical: "/subscribe" },
};

export default function Page() {
  return (<section className="hero wrap compact"><p className="eyebrow">Subscribe</p><h1>Hear when a list changes</h1>
    <p className="lede">Choose one or more disciplines. We will ask you to confirm by email first.</p>
    <div className="sub flush"><SubscribeForm categories={categories.map(({ slug, name }) => ({ slug, name }))} /></div></section>);
}
