import { categories } from "@/lib/data";
import SubscribeForm from "@/components/SubscribeForm";
export const metadata = { title: "Subscribe", alternates: { canonical: "/subscribe" } };
export default function Page() {
  return (<section className="hero wrap compact"><p className="eyebrow">Subscribe</p><h1>Hear when a list changes</h1>
    <p className="lede">Choose one or more disciplines. We will ask you to confirm by email first.</p>
    <div className="sub flush"><SubscribeForm categories={categories.map(({ slug, name }) => ({ slug, name }))} /></div></section>);
}
