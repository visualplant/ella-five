import { categories } from "@/lib/data";
import UnsubscribeView from "@/components/UnsubscribeView";

export const metadata = {
  title: "Unsubscribe",
  robots: { index: false },
  alternates: { canonical: "/unsubscribe" },
};

export default function Page() {
  return (
    <section className="hero wrap compact">
      <p className="eyebrow">Unsubscribe</p>
      <UnsubscribeView categories={categories.map(({ slug, name }) => ({ slug, name }))} />
    </section>
  );
}
