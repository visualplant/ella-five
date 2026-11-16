"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Home and About: "Ella" goes home. Every other internal page: "Ella" goes to About, with the homepage's "What about me?" hover.
export default function Wordmark() {
  const path = usePathname() || "/";
  if (path === "/" || path === "/about") {
    return <Link href="/" className="wordmark" aria-label="Ella home">Ella</Link>;
  }
  return (
    <Link href="/about" className="wordmark wm-about" aria-label="Ella. What about me? About Ella">
      Ella<span className="wm-what" aria-hidden="true">What about me?</span>
    </Link>
  );
}
