"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SubscriberSession } from "@/lib/rising";

type C = { slug: string; name: string };

export default function SubscribeForm({
  categories,
  preset,
  heading,
}: {
  categories: C[];
  preset?: string[];
  heading?: string;
}) {
  const [picked, setPicked] = useState<string[]>(preset ?? categories.map((c) => c.slug));
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");
  const [claim, setClaim] = useState<string | null>(null);
  const [subscriber, setSubscriber] = useState<SubscriberSession | null>(null);

  useEffect(() => {
    let mounted = true;
    try {
      const q = new URLSearchParams(window.location.search).get("claim");
      if (q) {
        setClaim(q);
        localStorage.setItem("ella_claim_token", q);
      } else {
        const saved = localStorage.getItem("ella_claim_token");
        if (saved) setClaim(saved);
      }
      const cached = localStorage.getItem("ella_subscriber");
      if (cached) {
        const parsed = JSON.parse(cached) as SubscriberSession;
        if (parsed?.email) setSubscriber(parsed);
      }
    } catch {
      // ignore
    }

    fetch("/api/subscribe")
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (j?.subscriber) {
          setSubscriber(j.subscriber);
          try {
            localStorage.setItem("ella_subscriber", JSON.stringify(j.subscriber));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});

    const onSub = (e: Event) => {
      const detail = (e as CustomEvent<SubscriberSession | null>).detail;
      setSubscriber(detail || null);
    };
    window.addEventListener("ella:subscriber", onSub);
    return () => {
      mounted = false;
      window.removeEventListener("ella:subscriber", onSub);
    };
  }, []);

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    if (!picked.length) {
      setState("err");
      setMsg("Choose at least one list.");
      return;
    }
    setState("sending");
    const r = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, categories: picked, ...(claim ? { claim } : {}) }),
    });
    const j = await r.json().catch(() => ({}));
    if (j?.subscriber) {
      setSubscriber(j.subscriber);
      try {
        localStorage.setItem("ella_subscriber", JSON.stringify(j.subscriber));
        window.dispatchEvent(new CustomEvent("ella:subscriber", { detail: j.subscriber }));
      } catch {
        // ignore storage errors
      }
    }
    setState(r.ok ? "ok" : "err");
    setMsg(j.message || (r.ok ? "" : "Something went wrong. Please try again."));
  }

  const activeSlugs = subscriber?.categories?.length ? subscriber.categories : [];
  const activeNames = categories.filter((c) => activeSlugs.includes(c.slug)).map((c) => c.name);
  const isKnownSubscriber = Boolean(subscriber?.email && activeNames.length > 0);

  if (isKnownSubscriber && state === "idle") {
    return (
      <p className="sub-known" role="status">
        You are subscribed as <strong>{subscriber!.email}</strong> to {activeNames.join(", ")}.{" "}
        <Link href="/unsubscribe" className="sub-unsub-link">
          Unsubscribe?
        </Link>
      </p>
    );
  }

  if (state === "ok") {
    return (
      <div className="sub-done-wrap" role="status">
        <p className="sub-done">{msg || "Thank you. Check your inbox to confirm your subscription."}</p>
        {isKnownSubscriber && (
          <p className="sub-known">
            You are subscribed as <strong>{subscriber!.email}</strong> to {activeNames.join(", ")}.{" "}
            <Link href="/unsubscribe" className="sub-unsub-link">
              Unsubscribe?
            </Link>
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {heading && <h2>{heading}</h2>}
      <form className="sub-form" onSubmit={submit}>
        <fieldset>
          <legend>Lists</legend>
          <div className="chips">
            {categories.map((c) => (
              <label key={c.slug} className="chip">
                <input
                  type="checkbox"
                  checked={picked.includes(c.slug)}
                  onChange={() => toggle(c.slug)}
                />
                <span>{c.name}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="sub-row">
          <label htmlFor="email" className="sr">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={subscriber?.email || ""}
          />
          <button type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Subscribe"}
          </button>
        </div>
        <p className="sub-fine" aria-live="polite">
          {state === "err" ? msg : "One email when a list changes. Confirm by email; unsubscribe in one click."}
        </p>
      </form>
    </>
  );
}
