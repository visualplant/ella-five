export const metadata = { title: "Unsubscribe", robots: { index: false } };
const copy: Record<string, [string, string]> = {
  ok: ["You are unsubscribed.", "You will not hear from Ella again. You can resubscribe any time."],
  invalid: ["That link has expired.", "It may already have been used. You can subscribe again from the home page."],
  unavailable: ["Not quite ready.", "Subscriptions open soon. Thank you for your patience."],
};
export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const [h, p] = copy[(await searchParams).s || "invalid"] || copy.invalid;
  return <section className="hero wrap compact"><p className="eyebrow">Unsubscribe</p><h1>{h}</h1><p className="lede">{p}</p><p><a href="/">Back to Ella</a></p></section>;
}
