"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CatIcon from "@/components/CatIcon";
import { dedupeSourcesByHost } from "@/lib/sources";
import type { Endorser, RisingPerson, SubscriberSession } from "@/lib/rising";

type CategoryMeta = { slug: string; name: string };
type VoteRecord = { count: number; upvoters: Endorser[] };

const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return u;
  }
};

export default function RisingStarsView({
  people,
  categories,
  initialVotes,
}: {
  people: RisingPerson[];
  categories: CategoryMeta[];
  initialVotes: Record<string, VoteRecord>;
}) {
  const [filter, setFilter] = useState<string>("all");
  const [votes, setVotes] = useState<Record<string, VoteRecord>>(initialVotes);
  const [myUpvotes, setMyUpvotes] = useState<string[]>([]);
  const [subscriber, setSubscriber] = useState<SubscriberSession | null>(null);
  const [claimToken, setClaimToken] = useState<string | null>(null);
  const [switchingEmail, setSwitchingEmail] = useState(false);
  const [switchInput, setSwitchInput] = useState("");

  // Per-item upvote prompt / notice state
  const [promptSlug, setPromptSlug] = useState<string | null>(null);
  const [promptEmail, setPromptEmail] = useState("");
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ slug: string; text: string } | null>(null);

  // Tip form state
  const [tipName, setTipName] = useState("");
  const [tipUrl, setTipUrl] = useState("");
  const [tipCat, setTipCat] = useState<string>("");
  const [tipNote, setTipNote] = useState("");
  const [tipEmail, setTipEmail] = useState("");
  const [tipUseCustomEmail, setTipUseCustomEmail] = useState(false);
  const [tipState, setTipState] = useState<"idle" | "sending" | "ok" | "pending" | "denied" | "err">("idle");
  const [tipMsg, setTipMsg] = useState("");

  const syncSubscriber = (s: SubscriberSession | null) => {
    setSubscriber(s);
    try {
      if (s) localStorage.setItem("ella_subscriber", JSON.stringify(s));
      else localStorage.removeItem("ella_subscriber");
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    let mounted = true;
    let claimParam: string | null = null;
    try {
      const sp = new URLSearchParams(window.location.search);
      claimParam = sp.get("claim");
      if (claimParam) {
        setClaimToken(claimParam);
        localStorage.setItem("ella_claim_token", claimParam);
      } else {
        const saved = localStorage.getItem("ella_claim_token");
        if (saved) setClaimToken(saved);
      }
      const votedParam = sp.get("voted");
      if (votedParam) {
        const p = people.find((x) => x.slug === votedParam);
        setNotice({
          slug: votedParam,
          text: `Email confirmed — your upvote${p ? ` for ${p.name}` : ""} has been counted.`,
        });
      }
      const tippedParam = sp.get("tipped");
      if (tippedParam) {
        setTipState("ok");
        setTipMsg(`Email confirmed — thank you. Ella will look into ${tippedParam === "1" ? "them" : tippedParam}.`);
      }
    } catch {
      // ignore
    }

    const qs = claimParam ? `?claim=${encodeURIComponent(claimParam)}` : "";
    fetch(`/api/rising-stars${qs}`)
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        if (j?.votes) setVotes(j.votes);
        if (Array.isArray(j?.myUpvotes)) setMyUpvotes(j.myUpvotes);
        if (j?.subscriber) {
          syncSubscriber(j.subscriber);
        } else {
          try {
            const raw = localStorage.getItem("ella_subscriber");
            if (raw) {
              const parsed = JSON.parse(raw) as SubscriberSession;
              if (parsed?.email || parsed?.memberSlug) setSubscriber(parsed);
            }
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {});

    const onSubEvent = (e: Event) => {
      const detail = (e as CustomEvent<SubscriberSession>).detail;
      if (detail?.email || detail?.memberSlug) {
        setSubscriber(detail);
        setPromptSlug(null);
        setNotice(null);
        setTipState("idle");
      }
    };
    window.addEventListener("ella:subscriber", onSubEvent);
    return () => {
      mounted = false;
      window.removeEventListener("ella:subscriber", onSubEvent);
    };
  }, [people]);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c.name])),
    [categories],
  );

  const displayed = useMemo(() => {
    const base = filter === "all" ? people : people.filter((p) => p.category === filter);
    return [...base].sort((a, b) => {
      const ca = votes[a.slug]?.count ?? a.upvotes ?? 0;
      const cb = votes[b.slug]?.count ?? b.upvotes ?? 0;
      return cb - ca;
    });
  }, [people, filter, votes]);

  async function submitVote(targetSlug: string, emailOverride?: string) {
    setBusySlug(targetSlug);
    setNotice(null);
    try {
      const r = await fetch("/api/rising-stars/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetSlug,
          ...(emailOverride ? { email: emailOverride } : subscriber?.email ? { email: subscriber.email, subscribe: false } : {}),
          ...(claimToken ? { claim: claimToken } : {}),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (j?.subscriber) syncSubscriber(j.subscriber);
      if (r.status === 401 || j?.code === "NEEDS_EMAIL") {
        setPromptSlug(targetSlug);
        return;
      }
      if (r.status === 202 || j?.code === "NEEDS_VERIFICATION") {
        setPromptSlug(null);
        setPromptEmail("");
        setNotice({
          slug: targetSlug,
          text: j?.message || "Check your inbox for a one-click link to confirm your email and count your upvote.",
        });
        return;
      }
      if (r.status === 403 || j?.code === "NOT_ON_LIST") {
        setPromptSlug(null);
        setNotice({
          slug: targetSlug,
          text: j?.message || "Only those who made the list can upvote rising stars.",
        });
        return;
      }
      if (!r.ok) {
        setNotice({
          slug: targetSlug,
          text: j?.message || "Something went wrong. Please try again.",
        });
        return;
      }
      if (j?.votes) setVotes(j.votes);
      if (Array.isArray(j?.myUpvotes)) setMyUpvotes(j.myUpvotes);
      setPromptSlug(null);
      setPromptEmail("");
    } finally {
      setBusySlug(null);
    }
  }

  function handleUpvoteClick(slug: string) {
    if (!subscriber) {
      setNotice(null);
      setPromptSlug((cur) => (cur === slug ? null : slug));
      return;
    }
    if (!subscriber.isListMember) {
      setPromptSlug(null);
      setNotice({
        slug,
        text: "Only those who made the list can upvote rising stars.",
      });
      return;
    }
    submitVote(slug);
  }

  async function handleSwitchEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = switchInput.trim();
    if (!clean) return;
    setClaimToken(null);
    try {
      localStorage.removeItem("ella_claim_token");
    } catch {
      // ignore
    }
    const r = await fetch("/api/rising-stars/vote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: clean }),
    });
    const j = await r.json().catch(() => ({}));
    if (j?.subscriber) {
      syncSubscriber(j.subscriber);
      if (j?.votes) setVotes(j.votes);
      if (Array.isArray(j?.myUpvotes)) setMyUpvotes(j.myUpvotes);
      setSwitchingEmail(false);
      setSwitchInput("");
      setNotice(null);
      setTipState("idle");
      setTipMsg("");
    }
  }

  async function handleTipSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTipState("sending");
    setTipMsg("");
    const emailToSend = tipUseCustomEmail || !subscriber ? tipEmail.trim() : subscriber.email;
    const r = await fetch("/api/rising-stars/tip", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: tipName,
        url: tipUrl,
        category: tipCat || undefined,
        note: tipNote,
        ...(emailToSend ? { email: emailToSend } : {}),
        ...(claimToken && !tipUseCustomEmail ? { claim: claimToken } : {}),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (j?.subscriber) syncSubscriber(j.subscriber);
    if (r.status === 202 || j?.code === "NEEDS_VERIFICATION") {
      setTipState("pending");
      setTipMsg(
        j?.message || "Check your inbox for a one-click link to confirm your email and send your tip to Ella.",
      );
      return;
    }
    if (r.status === 403 || j?.code === "NOT_ON_LIST") {
      setTipState("denied");
      setTipMsg(j?.message || "Only those who made the list can send a person tip to Ella.");
      return;
    }
    if (!r.ok) {
      setTipState("err");
      setTipMsg(j?.message || "Please enter a name and a valid email address.");
      return;
    }
    setTipState("ok");
    setTipMsg(j?.message || "Thank you. Ella will look into them.");
    setTipName("");
    setTipUrl("");
    setTipCat("");
    setTipNote("");
    setTipUseCustomEmail(false);
  }

  return (
    <>
      <section className="rs-sec wrap">
        <div className="rs-pad">
          <div className="rs-pad-bar">
            <span className="rs-pad-title">Working notes · Under consideration</span>
            <div className="rs-meta">
              {subscriber && !switchingEmail ? (
                <span className="rs-who">
                  {subscriber.isListMember && subscriber.memberName ? (
                    <>
                      List member:{" "}
                      {subscriber.profilePath ? (
                        <Link href={subscriber.profilePath} className="rs-who-name">
                          {subscriber.memberName}
                        </Link>
                      ) : (
                        <strong className="rs-who-name">{subscriber.memberName}</strong>
                      )}
                      {!subscriber.verified && <span> (unconfirmed)</span>}
                    </>
                  ) : (
                    <>Subscribed: {subscriber.email}</>
                  )}{" "}
                  <button
                    type="button"
                    className="rs-link-btn"
                    onClick={() => {
                      setSwitchingEmail(true);
                      setSwitchInput(subscriber.email);
                    }}
                  >
                    Change
                  </button>
                </span>
              ) : switchingEmail ? (
                <form className="rs-switch-form" onSubmit={handleSwitchEmail}>
                  <label htmlFor="rs-switch-email" className="sr">
                    Email address
                  </label>
                  <input
                    id="rs-switch-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={switchInput}
                    onChange={(e) => setSwitchInput(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="rs-mini-btn">
                    Save
                  </button>
                  <button
                    type="button"
                    className="rs-link-btn"
                    onClick={() => setSwitchingEmail(false)}
                  >
                    Cancel
                  </button>
                </form>
              ) : null}
              <a href="#send-tip" className="rs-tip-jump">
                + Send a tip
              </a>
            </div>
          </div>

          <div className="rs-filters" role="tablist" aria-label="Filter notes by discipline">
            <button
              type="button"
              role="tab"
              aria-selected={filter === "all"}
              className={`rs-tab ${filter === "all" ? "is-on" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={filter === c.slug}
                className={`rs-tab ${filter === c.slug ? "is-on" : ""}`}
                onClick={() => setFilter(c.slug)}
              >
                <CatIcon slug={c.slug} />
                {c.name}
              </button>
            ))}
          </div>

          <ul className="rs-notes">
            {displayed.map((p) => {
              const v = votes[p.slug] ?? { count: p.upvotes || 0, upvoters: [] };
              const isUpvoted = myUpvotes.includes(p.slug);
              const showPrompt = promptSlug === p.slug;
              const itemNotice = notice?.slug === p.slug ? notice.text : null;

              return (
                <li key={p.slug} id={p.slug} className="rs-note">
                  <span className="rs-bullet" aria-hidden="true">
                    –
                  </span>
                  <div className="rs-note-main">
                    <div className="rs-note-row">
                      <div className="rs-note-text">
                        <span className="rs-name">
                          {p.url ? (
                            <a href={p.url} target="_blank" rel="noopener nofollow">
                              {p.name}
                            </a>
                          ) : (
                            p.name
                          )}
                        </span>
                        <span className="rs-sep" aria-hidden="true">
                          ·
                        </span>
                        <span className="rs-role">
                          {p.role}, <span className="rs-org">{p.org}</span>
                        </span>
                        <Link href={`/${p.category}`} className="rs-cat-tag">
                          {catMap[p.category] || p.category}
                        </Link>
                      </div>

                      <button
                        type="button"
                        className={`rs-up ${isUpvoted ? "is-upvoted" : ""}`}
                        disabled={busySlug === p.slug}
                        aria-pressed={isUpvoted}
                        aria-label={`Upvote ${p.name}${v.count > 0 ? ` (${v.count})` : ""}`}
                        onClick={() => handleUpvoteClick(p.slug)}
                      >
                        <svg
                          className="rs-up-ico"
                          viewBox="0 0 12 12"
                          width="9"
                          height="9"
                          aria-hidden="true"
                        >
                          <path d="M6 2.2 10.2 8.8H1.8L6 2.2Z" fill="currentColor" />
                        </svg>
                        {v.count > 0 && <span className="rs-up-num">{v.count}</span>}
                        <span className="rs-up-lbl">{isUpvoted ? "Upvoted" : "Upvote"}</span>
                      </button>
                    </div>

                    <p className="rs-note-sub">
                      <span>{p.status}</span>
                      {dedupeSourcesByHost(p.sources).map((s) => (
                        <a
                          key={s}
                          href={s}
                          target="_blank"
                          rel="noopener nofollow"
                          className="rs-src"
                        >
                          [{host(s)}]
                        </a>
                      ))}
                      {v.upvoters.length > 0 && (
                        <span className="rs-endorsed">
                          · Co-signed by{" "}
                          {v.upvoters.map((u, idx) => (
                            <span key={u.slug}>
                              {idx > 0 && ", "}
                              <Link href={u.profilePath}>{u.name}</Link>
                            </span>
                          ))}
                        </span>
                      )}
                    </p>

                    {showPrompt && (
                      <form
                        className="rs-inline-capture"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!promptEmail.trim()) return;
                          submitVote(p.slug, promptEmail.trim());
                        }}
                      >
                        <label htmlFor={`rs-email-${p.slug}`} className="rs-prompt-label">
                          Enter your email to subscribe and upvote:
                        </label>
                        <div className="rs-prompt-row">
                          <input
                            id={`rs-email-${p.slug}`}
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={promptEmail}
                            onChange={(e) => setPromptEmail(e.target.value)}
                            autoFocus
                          />
                          <button type="submit" disabled={busySlug === p.slug}>
                            {busySlug === p.slug ? "Checking…" : "Upvote"}
                          </button>
                          <button
                            type="button"
                            className="rs-ghost-btn"
                            onClick={() => setPromptSlug(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {itemNotice && (
                      <p className="rs-notice" role="status" aria-live="polite">
                        <span>{itemNotice}</span>{" "}
                        <button
                          type="button"
                          className="rs-link-btn"
                          onClick={() => {
                            setNotice(null);
                            setClaimToken(null);
                            try {
                              localStorage.removeItem("ella_claim_token");
                            } catch {
                              // ignore
                            }
                            setPromptEmail(subscriber?.email || "");
                            setPromptSlug(p.slug);
                          }}
                        >
                          Use a different email
                        </button>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section id="send-tip" className="rs-tip wrap">
        <div className="rs-tip-head">
          <p className="eyebrow">Suggest someone</p>
          <h2>Send a person tip to Ella</h2>
          <p className="lede small">
            Spot an under-recognized builder behind shipped AI work? Anyone who has made Ella’s list can send a tip directly to her reading pile.
          </p>
        </div>

        {tipState === "ok" ? (
          <div className="rs-tip-done" role="status">
            <p className="sub-done">{tipMsg}</p>
            <p>
              <button
                type="button"
                className="rs-link-btn"
                onClick={() => {
                  setTipState("idle");
                  setTipMsg("");
                }}
              >
                Send another tip
              </button>
            </p>
          </div>
        ) : (
          <form className="rs-tip-form" onSubmit={handleTipSubmit}>
            <div className="rs-tip-grid">
              <div className="rs-field">
                <label htmlFor="tip-name">Person’s name</label>
                <input
                  id="tip-name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={tipName}
                  onChange={(e) => setTipName(e.target.value)}
                />
              </div>
              <div className="rs-field">
                <label htmlFor="tip-url">Public link (portfolio, launch post, GitHub, X, LinkedIn)</label>
                <input
                  id="tip-url"
                  name="url"
                  type="text"
                  placeholder="https://…"
                  value={tipUrl}
                  onChange={(e) => setTipUrl(e.target.value)}
                />
              </div>
            </div>

            <fieldset className="rs-tip-cats">
              <legend>Discipline (optional)</legend>
              <div className="chips">
                {categories.map((c) => (
                  <label key={c.slug} className="chip">
                    <input
                      type="radio"
                      name="category"
                      checked={tipCat === c.slug}
                      onClick={() => setTipCat((cur) => (cur === c.slug ? "" : c.slug))}
                      onChange={() => {}}
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="rs-field">
              <label htmlFor="tip-note">Why do you love them? What did they build or shape?</label>
              <textarea
                id="tip-note"
                name="note"
                rows={3}
                placeholder="Shipped product, research paper, open-source project, or launch receipt…"
                value={tipNote}
                onChange={(e) => setTipNote(e.target.value)}
              />
            </div>

            {(!subscriber || tipUseCustomEmail) ? (
              <div className="rs-tip-submit-row">
                <div className="rs-field rs-email-field">
                  <label htmlFor="tip-email">Your email address</label>
                  <input
                    id="tip-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={tipEmail}
                    onChange={(e) => setTipEmail(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={tipState === "sending"}>
                  {tipState === "sending" ? "Sending…" : "Send tip to Ella"}
                </button>
              </div>
            ) : (
              <div className="rs-tip-submit-bar">
                <button type="submit" disabled={tipState === "sending"}>
                  {tipState === "sending" ? "Sending…" : "Send tip to Ella"}
                </button>
                <span className="rs-tip-who">
                  {subscriber.isListMember && subscriber.memberName
                    ? `Sending as ${subscriber.memberName}${subscriber.verified ? "" : " (will confirm by email)"}`
                    : `Using ${subscriber.email}`}{" "}
                  ·{" "}
                  <button
                    type="button"
                    className="rs-link-btn"
                    onClick={() => {
                      setTipEmail(subscriber.email);
                      setTipUseCustomEmail(true);
                    }}
                  >
                    Use a different email
                  </button>
                </span>
              </div>
            )}

            {(tipState === "pending" || tipState === "denied" || tipState === "err") && (
              <p className="rs-notice" role="status" aria-live="polite">
                <span>{tipMsg}</span>{" "}
                {!tipUseCustomEmail && subscriber && (
                  <button
                    type="button"
                    className="rs-link-btn"
                    onClick={() => {
                      setTipEmail(subscriber.email);
                      setTipUseCustomEmail(true);
                      setTipState("idle");
                    }}
                  >
                    Use a different email
                  </button>
                )}
              </p>
            )}
          </form>
        )}
      </section>
    </>
  );
}
