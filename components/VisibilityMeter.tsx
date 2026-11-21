import type { PublicVisibility } from "@/lib/visibility";

// Visibility: how widely known someone is right now (1 Under the radar to 5 Iconic).
// A five-step heat bar; the step where Ella first spotted them gets a small marker underneath.
const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });

export default function VisibilityMeter({ vis }: { vis: PublicVisibility }) {
  if (vis.level == null) return <span className="pv-mute">Not yet confirmed<span className="vis-when">, checked {fmt(vis.checked)}</span></span>;
  const spot = vis.spotted?.level ?? null;
  const rose = vis.rise != null && vis.rise > 0 && vis.spotted;
  return <span className="vis">
    <span className="vis-bar" role="img" aria-label={`Visibility level ${vis.level} of 5: ${vis.label}`}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={`vis-seg${i <= vis.level! ? " on" : ""}${i === spot && rose ? " spot" : ""}`} style={{ ["--i" as string]: i }} />)}
    </span>
    <span className="vis-text">
      <span className="vis-label">{vis.label}</span>
      <span className="vis-when pv-mute">{rose ? `, up from ${vis.spotted!.label} when Ella spotted them (${fmt(vis.spotted!.date)})` : `, checked ${fmt(vis.checked)}`}</span>
    </span>
  </span>;
}
