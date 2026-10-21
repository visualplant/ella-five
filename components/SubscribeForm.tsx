"use client";
import { useState } from "react";
type C = { slug: string; name: string };
export default function SubscribeForm({ categories, preset }: { categories: C[]; preset?: string[] }) {
  const [picked, setPicked] = useState<string[]>(preset ?? categories.map((c) => c.slug));
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    if (!picked.length) { setState("err"); setMsg("Choose at least one list."); return; }
    setState("sending");
    const r = await fetch("/api/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, categories: picked }) });
    const j = await r.json().catch(() => ({}));
    setState(r.ok ? "ok" : "err"); setMsg(j.message || (r.ok ? "" : "Something went wrong. Please try again."));
  }
  if (state === "ok") return <p className="sub-done" role="status">{msg || "Thank you. Check your inbox to confirm your subscription."}</p>;
  return (
    <form className="sub-form" onSubmit={submit}>
      <fieldset>
        <legend>Lists</legend>
        <div className="chips">{categories.map((c) => (
          <label key={c.slug} className="chip"><input type="checkbox" checked={picked.includes(c.slug)} onChange={() => toggle(c.slug)} /><span>{c.name}</span></label>))}</div>
      </fieldset>
      <div className="sub-row">
        <label htmlFor="email" className="sr">Email address</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        <button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Subscribe"}</button>
      </div>
      <p className="sub-fine" aria-live="polite">{state === "err" ? msg : "One email when a list changes. Confirm by email; unsubscribe in one click."}</p>
    </form>
  );
}
