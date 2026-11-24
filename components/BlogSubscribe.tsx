import SubscribeForm from "@/components/SubscribeForm";
import { categories } from "@/lib/data";

export default function BlogSubscribe() {
  return (
    <div className="blog-sub">
      <SubscribeForm
        categories={categories.map(({ slug, name }) => ({ slug, name }))}
        heading="Hear when a list changes"
      />
    </div>
  );
}
