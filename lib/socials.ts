// Contact + social handles. Leave a value empty to hide its footer icon.
// x / threads: handle without @; linkedin: company page slug; bluesky: handle like ella.bsky.social
export const SOCIALS: Record<"email" | "x" | "linkedin" | "bluesky" | "threads", string> = {
  email: "ella@ellafive.com",
  x: "ellatracker",
  linkedin: "ellatracker", // LinkedIn company page slug → linkedin.com/company/<slug>/
  bluesky: "",
  threads: "",
};

export const socialLinks = () => {
  const s = SOCIALS, out: { key: string; href: string; label: string }[] = [];
  if (s.email) out.push({ key: "email", href: `mailto:${s.email}`, label: "Email Ella" });
  if (s.x) out.push({ key: "x", href: `https://x.com/${s.x.replace(/^@/, "")}`, label: "Ella on X" });
  if (s.linkedin) out.push({ key: "linkedin", href: `https://www.linkedin.com/company/${s.linkedin.replace(/^\/+|\/+$/g, "")}/`, label: "Ella on LinkedIn" });
  if (s.bluesky) out.push({ key: "bluesky", href: `https://bsky.app/profile/${s.bluesky.replace(/^@/, "")}`, label: "Ella on Bluesky" });
  if (s.threads) out.push({ key: "threads", href: `https://www.threads.net/@${s.threads.replace(/^@/, "")}`, label: "Ella on Threads" });
  return out;
};
export const socialSameAs = () => socialLinks().filter((l) => l.key !== "email").map((l) => l.href);
