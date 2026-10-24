"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SubscriberSession } from "@/lib/rising";

export default function HeaderSubscribe({ variant = "nav" }: { variant?: "nav" | "board" }) {
  const [subscriber, setSubscriber] = useState<SubscriberSession | null>(null);
  const [open, setOpen] = useState(false);
  const [gravOk, setGravOk] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    try {
      const cached = localStorage.getItem("ella_subscriber");
      if (cached) {
        const parsed = JSON.parse(cached) as SubscriberSession;
        if (parsed?.email && (!Array.isArray(parsed.categories) || parsed.categories.length > 0)) {
          setSubscriber(parsed);
        }
      }
    } catch {
      // ignore
    }

    const q = new URLSearchParams(window.location.search).get("claim");
    const url = q ? `/api/subscribe?claim=${encodeURIComponent(q)}` : "/api/subscribe";
    fetch(url)
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

  useEffect(() => {
    setGravOk(false);
    if (!subscriber?.gravatarHash) return;
    const img = new Image();
    img.onload = () => setGravOk(true);
    img.onerror = () => setGravOk(false);
    img.src = `https://www.gravatar.com/avatar/${subscriber.gravatarHash}?s=64&d=404`;
  }, [subscriber?.gravatarHash]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isSubscribed = Boolean(
    subscriber?.email && (!Array.isArray(subscriber.categories) || subscriber.categories.length > 0),
  );

  if (!isSubscribed || !subscriber) {
    return (
      <Link href="/subscribe" className={variant === "board" ? "b-sub" : "nav-sub"}>
        Subscribe
      </Link>
    );
  }

  const gravUrl = subscriber.gravatarHash
    ? `https://www.gravatar.com/avatar/${subscriber.gravatarHash}?s=64&d=404`
    : null;

  return (
    <div ref={wrapRef} className={`u-menu ${variant === "board" ? "u-board" : "u-nav"}`}>
      <button
        type="button"
        className="u-btn"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Subscribed as: ${subscriber.email}`}
        onClick={() => setOpen((v) => !v)}
      >
        {gravUrl && gravOk ? (
          <img src={gravUrl} alt="" width="28" height="28" className="u-grav" />
        ) : (
          <svg
            className="u-ico"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
          </svg>
        )}
      </button>

      {open && (
        <div className="u-pop" role="dialog" aria-label="Subscription details">
          <p className="u-pop-line">
            Subscribed as: <strong>{subscriber.email}</strong>
          </p>
          <p className="u-pop-act">
            <Link href="/unsubscribe" onClick={() => setOpen(false)}>
              Manage or unsubscribe
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
