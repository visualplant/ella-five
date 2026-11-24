export const metadata = { title: "Confirm", robots: { index: false } };
type Copy = { h: string; p: string; cta?: [string, string] };
const copy: Record<string, Copy> = {
  ok: { h: "You are subscribed.", p: "We will write only when a list you follow changes." },
  invalid: { h: "That link has expired.", p: "It may already have been used, or it is more than a few days old. You can subscribe again in a moment.", cta: ["/subscribe", "Subscribe again"] },
  error: { h: "Something went wrong.", p: "We could not finish confirming just now. Please try the link again in a minute, or subscribe again.", cta: ["/subscribe", "Subscribe again"] },
  unavailable: { h: "Not quite ready.", p: "Subscriptions open soon. Thank you for your patience." },
};
export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string | string[] }> }) {
  let key = "invalid";
  try { const s = (await searchParams).s; key = (Array.isArray(s) ? s[0] : s) || "invalid"; } catch { /* fall through */ }
  const c = Object.prototype.hasOwnProperty.call(copy, key) ? copy[key] : copy.invalid;
  return (
    <section className="hero wrap compact">
      <p className="eyebrow">Confirm</p>
      <h1>{c.h}</h1>
      <p className="lede">{c.p}</p>
      <p>{c.cta ? <><a href={c.cta[0]}>{c.cta[1]}</a>{" · "}</> : null}<a href="/">Back to Ella</a></p>
    </section>
  );
}
