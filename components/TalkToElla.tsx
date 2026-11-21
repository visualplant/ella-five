"use client";

import { useEffect, useState } from "react";
import { startTalkToElla, subscribeTavusReady } from "@/components/tavus-host";

export default function TalkToElla({ variant, label = "Talk to Ella" }: { variant: "board" | "person" | "about"; label?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => subscribeTavusReady(setReady), []);

  return (
    <button
      type="button"
      className={`talk-ella talk-ella-${variant}`}
      disabled={!ready}
      aria-label={ready ? label : `${label}, available in a moment`}
      onClick={startTalkToElla}
    >
      {label}
    </button>
  );
}
