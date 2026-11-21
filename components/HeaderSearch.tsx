"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@ui-sdk/react/autocomplete";
import type { SearchHit } from "@/lib/search";
import { searchFilter, shouldOpenSuggestions } from "@/lib/search-query";

export default function HeaderSearch({
  people,
  variant = "nav",
}: {
  people: SearchHit[];
  variant?: "nav" | "board";
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const suggestOpen = shouldOpenSuggestions(expanded, query);

  function collapse() {
    setExpanded(false);
    setQuery("");
  }

  useEffect(() => {
    if (!expanded) return;
    const id = window.requestAnimationFrame(() => {
      wrapRef.current?.querySelector("input")?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (wrapRef.current?.contains(target)) return;
      const slot = target instanceof Element ? target.closest("[data-slot]") : null;
      if (slot && slot.getAttribute("data-slot")?.startsWith("autocomplete-")) return;
      collapse();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        collapse();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [expanded]);

  return (
    <div
      ref={wrapRef}
      className="header-search"
      data-variant={variant}
      data-expanded={expanded ? "" : undefined}
    >
      <button
        type="button"
        className="header-search-btn"
        aria-label="Search"
        aria-expanded={expanded}
        aria-controls={`header-search-panel-${variant}`}
        tabIndex={expanded ? -1 : 0}
        aria-hidden={expanded || undefined}
        onClick={() => setExpanded(true)}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="11" cy="11" r="6.25" />
          <path d="M16 16l4.5 4.5" />
        </svg>
      </button>

      <div
        id={`header-search-panel-${variant}`}
        className="header-search-panel"
        inert={!expanded || undefined}
      >
        <Autocomplete
          value={query}
          onValueChange={setQuery}
          open={suggestOpen}
          filter={searchFilter}
          autoHighlight
          presentation="popover"
        >
          <AutocompleteInput
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Search"
            placeholder="Search people…"
          />
          <AutocompleteContent side="bottom" align="end" sideOffset={6}>
            <AutocompleteEmpty>No one found</AutocompleteEmpty>
            <AutocompleteList>
              {people.map((hit) => (
                <AutocompleteItem
                  key={hit.id}
                  value={hit.id}
                  label={hit.name}
                  keywords={hit.keywords}
                  render={<Link href={hit.href} onClick={collapse} />}
                >
                  <span className="hs-name">{hit.name}</span>
                  <span className="hs-secondary">{hit.secondary}</span>
                </AutocompleteItem>
              ))}
            </AutocompleteList>
          </AutocompleteContent>
        </Autocomplete>
        <button
          type="button"
          className="header-search-close"
          aria-label="Close search"
          tabIndex={expanded ? 0 : -1}
          onClick={collapse}
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
