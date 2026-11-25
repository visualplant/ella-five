"use client";

import { useEffect, useState } from "react";
import { startTalkToElla, subscribeTavusReady } from "@/components/tavus-host";
import { TAVUS_DEPLOYMENT_ID } from "@/lib/tavus-catalog";

export default function TalkToElla({ variant, label = "Talk to Ella" }: { variant: "board" | "person" | "about"; label?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => subscribeTavusReady(setReady), []);

  if (!TAVUS_DEPLOYMENT_ID) return null;

  return (
    <button
      type="button"
      className={`talk-ella talk-ella-${variant}`}
      aria-label={ready ? label : `${label}, starting in a moment`}
      onClick={startTalkToElla}
    >
      {label}
    </button>
  );
}
