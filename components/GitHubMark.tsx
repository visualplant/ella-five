import { REPO } from "@/lib/data";
import { socialLinks } from "@/lib/socials";

const S = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: "false" as const };
const ICON: Record<string, React.ReactNode> = {
  email: <svg {...S}><rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2" /><path d="m3 6.5 9 6.25 9-6.25" /></svg>,
  x: <svg {...S} stroke="none" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  linkedin: <svg {...S}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>,
  bluesky: <svg {...S}><path d="M12 11c-1.5-3-5.5-7-8-7-1 0-1.5 1-1.5 2.5S3 12 6 12.5C3.5 13 3 15 5 17c3 3 5.5-1 7-4 1.5 3 4 7 7 4 2-2 1.5-4-1-4.5 3-.5 3.5-4.5 3.5-6S21 4 20 4c-2.5 0-6.5 4-8 7z" /></svg>,
  threads: <svg {...S}><circle cx="12" cy="12" r="4" /><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1" /></svg>,
};

export default function GitHubMark({ archive = false }: { archive?: boolean }) {
  return (
    <span className="f-links">
      {archive && <a href="/archive" className="f-arch">Archive</a>}
      {socialLinks().map((l) => <a key={l.key} href={l.href} className="gh" aria-label={l.label} {...(l.key === "email" ? {} : { rel: "noopener me", target: "_blank" })}>{ICON[l.key]}</a>)}
      <a href={REPO} className="gh" aria-label="Source on GitHub" rel="noopener"><svg viewBox="0 0 16 16" width="19" height="19" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a>
    </span>
  );
}
