"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import "@tavus/widget";
import { TavusIntegration, type TavusElement, type TavusEventMap } from "@tavus/widget";
import {
  TAVUS_DEPLOYMENT_ID,
  categoryBySlug,
  pageContext,
  pathForPage,
  personBySlug,
  weekByDate,
  type EllaCatalog,
} from "@/lib/tavus-catalog";
import { setTavusIntegration, setTavusReady } from "@/components/tavus-host";

function parseArgs(raw: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (!raw || !raw.trim()) return { ok: true, value: {} };
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "Tool arguments must be a JSON object." };
    }
    return { ok: true, value: value as Record<string, unknown> };
  } catch {
    return { ok: false, error: "The tool arguments were not valid JSON." };
  }
}

function handleTool(
  detail: TavusEventMap["tavus:tool-call"],
  integration: TavusIntegration,
  router: { push: (href: string) => void },
  catalog: EllaCatalog,
) {
  const reply = (status: "success" | "error", output: string | Record<string, unknown>) => {
    if (!detail.tool_call_id) return;
    integration.sendMessage({
      event_type: "conversation.tool_result",
      properties: { tool_call_id: detail.tool_call_id, output, status },
    });
  };

  const parsed = parseArgs(detail.arguments);
  if (!parsed.ok) {
    reply("error", parsed.error);
    return;
  }
  const args = parsed.value;

  switch (detail.name) {
    case "open_person": {
      const slug = typeof args.slug === "string" ? args.slug.trim() : "";
      if (!slug) {
        reply("error", "A person slug is required, for example 'demis-hassabis'.");
        return;
      }
      const person = personBySlug(catalog, slug);
      if (!person) {
        reply("error", `No one on Ella has the slug "${slug}".`);
        return;
      }
      router.push(person.href);
      reply("success", { opened: person.href, name: person.name, category: person.categoryName });
      return;
    }
    case "open_category": {
      const slug = typeof args.category === "string" ? args.category.trim() : "";
      if (!slug) {
        reply("error", "A category is required: technical, design, research, product, or growth.");
        return;
      }
      const category = categoryBySlug(catalog, slug);
      if (!category) {
        reply("error", `"${slug}" is not a list category. Use technical, design, research, product, or growth.`);
        return;
      }
      const href = `/${category.slug}`;
      router.push(href);
      reply("success", { opened: href, category: category.name });
      return;
    }
    case "open_page": {
      const page = typeof args.page === "string" ? args.page.trim() : "";
      const href = page ? pathForPage(page) : undefined;
      if (!href) {
        reply("error", "A page is required: home, rising-stars, archive, about, or developers.");
        return;
      }
      router.push(href);
      reply("success", { opened: href, page: page.toLowerCase() });
      return;
    }
    case "open_archive": {
      const date = typeof args.date === "string" ? args.date.trim() : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        reply("error", "An archive date is required in YYYY-MM-DD format.");
        return;
      }
      const week = weekByDate(catalog, date);
      if (!week) {
        reply("error", `There is no published list for ${date}.`);
        return;
      }
      const href = `/archive/${week.date}`;
      router.push(href);
      reply("success", { opened: href, date: week.date, label: week.label });
      return;
    }
    default:
      reply("error", `The page does not implement the tool "${detail.name}".`);
  }
}

export default function TavusElla({ catalog }: { catalog: EllaCatalog }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const integrationRef = useRef<TavusIntegration | null>(null);
  const liveRef = useRef(false);
  const [live, setLive] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const catalogRef = useRef(catalog);
  const prevLiveContext = useRef<string | null>(null);
  const context = pageContext(pathname, catalog);
  catalogRef.current = catalog;

  const setWidget = useCallback((el: TavusElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!el) {
      integrationRef.current = null;
      liveRef.current = false;
      setTavusIntegration(null);
      return;
    }

    const integration = new TavusIntegration("tavus-widget");
    integrationRef.current = integration;
    setTavusIntegration(integration);

    const onReady = () => setTavusReady(true);
    const onStarted = () => {
      liveRef.current = true;
      setLive(true);
    };
    const onEnded = () => {
      liveRef.current = false;
      setLive(false);
      prevLiveContext.current = null;
    };
    const onTool = (e: CustomEvent<TavusEventMap["tavus:tool-call"]>) => {
      const current = integrationRef.current;
      if (!current) return;
      handleTool(e.detail, current, router, catalogRef.current);
    };

    // Subscribe in the same tick the element is attached so ready is not missed.
    // If methods are already installed, treat the element as ready immediately.
    if (typeof el.startConversation === "function") onReady();
    integration.on("tavus:ready", onReady);
    integration.on("tavus:conversation-started", onStarted);
    integration.on("tavus:conversation-ended", onEnded);
    integration.on("tavus:tool-call", onTool);

    cleanupRef.current = () => {
      integration.off("tavus:ready", onReady);
      integration.off("tavus:conversation-started", onStarted);
      integration.off("tavus:conversation-ended", onEnded);
      integration.off("tavus:tool-call", onTool);
    };
  }, [router]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      integrationRef.current = null;
      liveRef.current = false;
      setTavusIntegration(null);
    };
  }, []);

  useEffect(() => {
    if (!liveRef.current) {
      prevLiveContext.current = null;
      return;
    }
    if (prevLiveContext.current === context) return;
    prevLiveContext.current = context;
    integrationRef.current?.sendMessage({
      event_type: "conversation.append_llm_context",
      properties: { context },
    });
  }, [context]);

  // Ella's live avatar is offered only on the About page ("Meet me" link). Once a call is live
  // the element stays mounted across navigation so Ella's navigation tools don't end the call.
  if (!TAVUS_DEPLOYMENT_ID) return null;
  if (pathname !== "/about" && !live) return null;

  return (
    <tavus-widget
      ref={setWidget}
      deployment-id={TAVUS_DEPLOYMENT_ID}
      conversational-context={context}
    />
  );
}
