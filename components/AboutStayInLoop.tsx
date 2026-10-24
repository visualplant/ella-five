"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { SubscriberSession } from "@/lib/rising";

type C = { slug: string; name: string };

export default function AboutStayInLoop({ categories }: { categories: C[] }) {
  const [subscriber, setSubscriber] = useState<SubscriberSession | null>(null);

  useEffect(() => {
    let mounted = true;
    try {
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
        if (j?.subscriber) setSubscriber(j.subscriber);
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

  const activeSlugs = subscriber?.categories?.length ? subscriber.categories : [];
  const activeNames = categories.filter((c) => activeSlugs.includes(c.slug)).map((c) => c.name);
  const isKnownSubscriber = Boolean(subscriber?.email && activeNames.length > 0);

  if (isKnownSubscriber) {
    return (
      <p>
        You are subscribed as <strong>{subscriber!.email}</strong> to {activeNames.join(", ")}.{" "}
        <Link href="/unsubscribe">Unsubscribe?</Link>
      </p>
    );
  }

  return (
    <p>
      <Link href="/subscribe">Subscribe</Link> to any of the five disciplines and I’ll email you when that list changes. Nothing else, no spam.
    </p>
  );
}
