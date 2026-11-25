"use client";

import { useEffect, useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";
import { TAVUS_DEPLOYMENT_ID, type EllaCatalog } from "@/lib/tavus-catalog";
import { subscribeTavusLoadRequest } from "@/components/tavus-host";

type WidgetProps = { catalog: EllaCatalog };

export default function TavusElla({ catalog }: { catalog: EllaCatalog }) {
  const pathname = usePathname() || "/";
  const [Widget, setWidget] = useState<ComponentType<WidgetProps> | null>(null);

  useEffect(() => {
    if (!TAVUS_DEPLOYMENT_ID) return;
    let cancelled = false;
    const load = () => {
      import("./TavusEllaWidget").then((mod) => {
        if (!cancelled) setWidget(() => mod.default);
      });
    };
    const unsub = subscribeTavusLoadRequest(load);
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    if (pathname === "/about") {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(() => load());
      } else {
        timeoutId = window.setTimeout(load, 1);
      }
    }
    return () => {
      cancelled = true;
      unsub();
      if (idleId !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  if (!TAVUS_DEPLOYMENT_ID || !Widget) return null;
  return <Widget catalog={catalog} />;
}
