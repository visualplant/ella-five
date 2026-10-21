export const metadata = { title: "Confirm", robots: { index: false } };
const copy: Record<string, [string, string]> = {
  ok: ["You are subscribed.", "We will write only when a list you follow changes."],
  invalid: ["That link has expired.", "It may already have been used. You can subscribe again from the home page."],
  unavailable: ["Not quite ready.", "Subscriptions open soon. Thank you for your patience."],
};
export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const [h, p] = copy[(await searchParams).s || "invalid"] || copy.invalid;
  return <section className="hero wrap compact"><p className="eyebrow">Confirm</p><h1>{h}</h1><p className="lede">{p}</p><p><a href="/">Back to Ella</a></p></section>;
}
