"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Dialog, DialogBackdrop, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@ui-sdk/react/dialog";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/react/tabs";
import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from "@ui-sdk/react/segmented-control";
// The whole Ella 5x5 badge UI in one file: the badge on a profile, its label, and the embed dialog.
// All wording, formats, sizes and snippets come from lib/badge.ts (the one config file).
import { BADGE_HEIGHT, BADGE_LABEL, BADGE_TEXT as T, BADGE_WIDTHS, badgeHtml, badgeLink, badgeMarkdown, badgePath, badgePngName, badgeSubtitle, badgeTitle, type BadgeAppearance, type BadgeTheme } from "@/lib/badge";

type Mode = "auto" | BadgeTheme;
type Tab = "html" | "md" | "link";

/** Keep every tab panel in layout. The tabs primitive sets hidden="", and the UA [hidden] { display:none !important } rule cannot be overridden in author CSS, so we drop the attribute and hide inactive panels with visibility + inert instead. */
function stackedPanel(props: Record<string, unknown>) {
  const { hidden: _hidden, ...rest } = props;
  return <div {...rest} />;
}

function useDarkScheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const on = () => setDark(m.matches); on();
    m.addEventListener("change", on); return () => m.removeEventListener("change", on);
  }, []);
  return dark;
}

/** Theme-aware badge image (follows the visitor's color scheme), as the default embed does. */
function BadgePicture({ a, mode }: { a: BadgeAppearance; mode: Mode }) {
  const w = BADGE_WIDTHS[a.category], alt = badgeTitle(a);
  if (mode !== "auto") return <img src={badgePath(a, mode)} alt={alt} width={w} height={BADGE_HEIGHT} />;
  return <picture><source media="(prefers-color-scheme: dark)" srcSet={badgePath(a, "dark")} /><img src={badgePath(a, "light")} alt={alt} width={w} height={BADGE_HEIGHT} /></picture>;
}

function Code({ id, value, label }: { id: string; value: string; label: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Pre-select the code whenever it changes, without moving focus.
  useEffect(() => { const t = ref.current; if (t) t.setSelectionRange(0, t.value.length); }, [value]);
  return <textarea id={id} ref={ref} className="bdg-code" readOnly spellCheck={false} rows={value.split("\n").length} value={value} aria-label={label} onFocus={(e) => e.currentTarget.select()} onClick={(e) => e.currentTarget.select()} />;
}

/** Pass a person's appearances (any order); renders nothing when there are none. Newest is the default; 2+ shows a picker. */
export default function BadgeEmbed({ appearances }: { appearances: BadgeAppearance[] }) {
  return appearances.length ? <Badge input={appearances} /> : null;
}

function Badge({ input }: { input: BadgeAppearance[] }) {
  const appearances = useMemo(() => [...input].sort((x, y) => y.week.localeCompare(x.week)), [input]);
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<Mode>("auto");
  const [tab, setTab] = useState<Tab>("html");
  const [copied, setCopied] = useState(false);
  const [png, setPng] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dark = useDarkScheme();
  // Touch: focus the dialog itself (no zoom onto the code box); the code is still pre-selected.
  const [coarse, setCoarse] = useState(false);
  useEffect(() => { setCoarse(window.matchMedia("(pointer: coarse)").matches); }, []);
  const uid = useId().replace(/:/g, "");
  const a = appearances[idx] ?? appearances[0];
  const force = mode === "auto" ? undefined : mode;
  const shown: BadgeTheme = mode === "auto" ? (dark ? "dark" : "light") : mode;
  const code = useMemo(() => ({ html: badgeHtml(a, force), md: badgeMarkdown(a, force), link: badgeLink(a) }), [a, force]);
  // Every tab × theme snippet, used only to size the code area to the tallest combination.
  const sizers = useMemo(() => {
    const themes: (BadgeTheme | undefined)[] = [undefined, "light", "dark"];
    const values = [
      ...themes.flatMap((t) => [badgeHtml(a, t), badgeMarkdown(a, t)]),
      badgeLink(a),
    ];
    return [...new Set(values)];
  }, [a]);

  // 2x PNG of the badge currently shown, rendered from the SVG in the browser (outlined type, transparent background).
  useEffect(() => {
    let url: string | null = null, dead = false;
    const img = new Image();
    img.onload = () => {
      const w = BADGE_WIDTHS[a.category] * 2, h = BADGE_HEIGHT * 2;
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d")?.drawImage(img, 0, 0, w, h);
      c.toBlob((b) => { if (!b || dead) return; url = URL.createObjectURL(b); setPng(url); }, "image/png");
    };
    img.src = badgePath(a, shown);
    return () => { dead = true; if (url) URL.revokeObjectURL(url); setPng(null); };
  }, [a, shown]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => { setCopied(false); }, [tab, a, mode]);

  const copy = async () => {
    const text = code[tab];
    try { await navigator.clipboard.writeText(text); }
    catch { const t = document.getElementById(`${uid}-code-${tab}`) as HTMLTextAreaElement | null; t?.select(); try { document.execCommand("copy"); } catch { /* ignore */ } }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };
  const desc = badgeSubtitle(a);
  const file = badgePngName(a, shown);

  return (
    <div className="bdg">
      <p className="bdg-label" aria-hidden="true">{BADGE_LABEL}</p>
      <Dialog>
        <DialogTrigger className="bdg-open" aria-label={`${badgeTitle(a)}. ${BADGE_LABEL}`}>
          {/* The site is light-only, so the badge on the page itself is always the light artwork. */}
          <BadgePicture a={a} mode="light" />
        </DialogTrigger>
        <DialogBackdrop className="bdg-back" />
        <DialogContent className="bdg-dlg" initialFocus={coarse ? "content" : () => document.getElementById(`${uid}-code-${tab}`)}>
          <DialogTitle>{BADGE_LABEL}</DialogTitle>
          <DialogDescription className="bdg-desc">{desc}</DialogDescription>
          {appearances.length > 1 && (
            <p className="bdg-pick">
              <label htmlFor={`${uid}-which`}>{T.picker}</label>
              <select id={`${uid}-which`} value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
                {appearances.map((x, i) => <option key={`${x.week}-${x.category}`} value={i}>{badgeSubtitle(x)}</option>)}
              </select>
            </p>
          )}
          <div className="bdg-prev" data-theme={mode} aria-label={T.preview}>
            <BadgePicture a={a} mode={mode} />
          </div>
          <div className="bdg-theme">
            <SegmentedControl className="bdg-seg" aria-label={T.themeGroup} value={mode} onValueChange={(v) => v && setMode(v as Mode)}>
              <SegmentedControlIndicator />
              <SegmentedControlItem value="auto">{T.themes.auto}</SegmentedControlItem>
              <SegmentedControlItem value="light">{T.themes.light}</SegmentedControlItem>
              <SegmentedControlItem value="dark">{T.themes.dark}</SegmentedControlItem>
            </SegmentedControl>
          </div>
          <Tabs className="bdg-tabs" value={tab} onValueChange={(v) => v && setTab(v as Tab)}>
            <TabsList aria-label={T.tabsGroup}>
              <TabsTab value="html">{T.tabs.html}</TabsTab>
              <TabsTab value="md">{T.tabs.md}</TabsTab>
              <TabsTab value="link">{T.tabs.link}</TabsTab>
            </TabsList>
            <div className="bdg-panels">
              <div className="bdg-sizers" aria-hidden="true" inert>
                {sizers.map((value) => (
                  <pre key={value} className="bdg-sizer">{value}</pre>
                ))}
              </div>
              <TabsPanel value="html" keepMounted render={stackedPanel} inert={tab !== "html"} aria-hidden={tab !== "html" ? true : undefined}>
                <Code id={`${uid}-code-html`} value={code.html} label={T.tabLabels.html} />
              </TabsPanel>
              <TabsPanel value="md" keepMounted render={stackedPanel} inert={tab !== "md"} aria-hidden={tab !== "md" ? true : undefined}>
                <Code id={`${uid}-code-md`} value={code.md} label={T.tabLabels.md} />
              </TabsPanel>
              <TabsPanel value="link" keepMounted render={stackedPanel} inert={tab !== "link"} aria-hidden={tab !== "link" ? true : undefined}>
                <Code id={`${uid}-code-link`} value={code.link} label={T.tabLabels.link} />
              </TabsPanel>
            </div>
          </Tabs>
          <div className="bdg-row">
            {png ? <a className="bdg-png" href={png} download={file}>{T.download}</a> : <span className="bdg-png" aria-hidden="true">{T.download}</span>}
            <button type="button" className="bdg-copy" onClick={copy}><span aria-live="polite">{copied ? T.copied : T.copy}</span></button>
          </div>
          <DialogClose className="bdg-x" aria-label={T.close}>
            <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
