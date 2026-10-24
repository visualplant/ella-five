"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SubscriberSession } from "@/lib/rising";

type C = { slug: string; name: string };

export default function UnsubscribeView({ categories }: { categories: C[] }) {
  const [subscriber, setSubscriber] = useState<SubscriberSession | null>(null);
  const [picked, setPicked] = useState<string[]>(categories.map((c) => c.slug));
  const [emailInput, setEmailInput] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "idle" | "saving" | "unsubscribed" | "saved" | "err">("loading");
  const [msg, setMsg] = useState("");

  const syncGlobal = (sub: SubscriberSession | null) => {
    setSubscriber(sub);
    try {
      if (sub) localStorage.setItem("ella_subscriber", JSON.stringify(sub));
      else localStorage.removeItem("ella_subscriber");
      window.dispatchEvent(new CustomEvent("ella:subscriber", { detail: sub }));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let mounted = true;
    const sp = new URLSearchParams(window.location.search);
    const tok = sp.get("token");
    const statusParam = sp.get("s");
    if (tok) setToken(tok);

    try {
      const cached = localStorage.getItem("ella_subscriber");
      if (cached) {
        const parsed = JSON.parse(cached) as SubscriberSession;
        if (parsed?.email) {
          setSubscriber(parsed);
          setEmailInput(parsed.email);
          if (Array.isArray(parsed.categories)) setPicked(parsed.categories);
        }
      }
    } catch {
      // ignore
    }

    const url = tok ? `/api/unsubscribe?inspect=1&token=${encodeURIComponent(tok)}` : "/api/unsubscribe?inspect=1";
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (j?.subscriber) {
          syncGlobal(j.subscriber);
          setEmailInput(j.subscriber.email || "");
          if (Array.isArray(j.subscriber.categories)) {
            setPicked(j.subscriber.categories);
          }
        }
        if (statusParam === "ok") {
          setState("unsubscribed");
          setMsg("You have been unsubscribed. You can re-subscribe to any list below.");
        } else {
          setState("idle");
        }
      })
      .catch(() => {
        if (mounted) setState("idle");
      });

    return () => {
      mounted = false;
    };
  }, []);

  const toggle = (slug: string) =>
    setPicked((cur) => (cur.includes(slug) ? cur.filter((x) => x !== slug) : [...cur, slug]));

  async function updateSubscription(nextCategories: string[], nextState: "unsubscribed" | "saved") {
    setState("saving");
    setMsg("");
    const email = (subscriber?.email || emailInput).trim().toLowerCase();
    if (!email) {
      setState("err");
      setMsg("Please enter your email address.");
      return;
    }

    const r = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        categories: nextCategories,
        ...(token ? { token } : {}),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setState("err");
      setMsg(j?.message || "Something went wrong. Please try again.");
      return;
    }

    if (j?.subscriber) {
      syncGlobal(j.subscriber);
      setPicked(j.subscriber.categories || []);
    }
    setState(nextState);
    setMsg(j?.message || (nextState === "unsubscribed" ? "You are unsubscribed." : "Your subscription has been updated."));
  }

  const activeSlugs = subscriber?.categories ?? [];
  const activeNames = categories.filter((c) => activeSlugs.includes(c.slug)).map((c) => c.name);
  const hasActiveSubscription = Boolean(subscriber?.email && activeNames.length > 0);

  return (
    <div className="unsub-wrap">
      <h1>{hasActiveSubscription ? "Manage your subscription" : "Unsubscribed"}</h1>

      {hasActiveSubscription ? (
        <p className="sub-known unsub-status" role="status">
          You are subscribed as <strong>{subscriber!.email}</strong> to {activeNames.join(", ")}.
        </p>
      ) : subscriber?.email ? (
        <p className="sub-known unsub-status" role="status">
          <strong>{subscriber.email}</strong> is currently unsubscribed from all Ella lists.
        </p>
      ) : (
        <p className="lede">
          Enter your email address below to unsubscribe or update the disciplines you follow.
        </p>
      )}

      {msg && (
        <p className="unsub-feedback" role="status" aria-live="polite">
          {msg}
        </p>
      )}

      <div className="sub flush unsub-box">
        <form
          className="sub-form"
          onSubmit={(e) => {
            e.preventDefault();
            const targetCats = picked.length > 0 ? picked : categories.map((c) => c.slug);
            setPicked(targetCats);
            updateSubscription(targetCats, "saved");
          }}
        >
          {!subscriber?.email && (
            <div className="sub-row unsub-email-row">
              <label htmlFor="unsub-email" className="sr">
                Email address
              </label>
              <input
                id="unsub-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
          )}

          <fieldset>
            <legend>Disciplines</legend>
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

          <div className="unsub-actions">
            {hasActiveSubscription ? (
              <>
                <button
                  type="button"
                  className="unsub-all-btn"
                  disabled={state === "saving"}
                  onClick={() => {
                    setPicked([]);
                    updateSubscription([], "unsubscribed");
                  }}
                >
                  {state === "saving" ? "Updating…" : "Unsubscribe from all"}
                </button>
                <button
                  type="submit"
                  className="unsub-sec-btn"
                  disabled={state === "saving" || picked.length === 0}
                >
                  Save preferences
                </button>
              </>
            ) : (
              <>
                <button type="submit" disabled={state === "saving"}>
                  {state === "saving"
                    ? "Re-subscribing…"
                    : picked.length > 0
                      ? "Re-subscribe to selected"
                      : "Re-subscribe to all lists"}
                </button>
                {!subscriber?.email && (
                  <button
                    type="button"
                    className="unsub-sec-btn"
                    disabled={state === "saving"}
                    onClick={() => updateSubscription([], "unsubscribed")}
                  >
                    Unsubscribe from all
                  </button>
                )}
              </>
            )}
          </div>
        </form>
      </div>

      <p className="pv-back">
        <Link href="/">← Back to Ella</Link>
      </p>
    </div>
  );
}
