import type { Metadata, Viewport } from "next";
import { Newsreader, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { SITE, REPO, categories } from "@/lib/data";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Ella, the original AI Talent Tracker", template: "%s · Ella" },
  description: "A short, sourced, regularly updated list of exceptional people in AI across Technical, Design, Research, Product and Growth.",
  openGraph: { type: "website", siteName: "Ella", title: "Ella, the original AI Talent Tracker", description: "Five people, five disciplines, every status sourced." },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#f6f3ee" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header wrap">
          <Link href="/" className="wordmark" aria-label="Ella home">Ella</Link>
          <nav aria-label="Categories">
            <ul>{categories.map((c) => <li key={c.slug}><Link href={`/${c.slug}`}>{c.name}</Link></li>)}
              <li><Link href="/subscribe" className="nav-sub">Subscribe</Link></li></ul>
          </nav>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer wrap">
          <p className="f-brand"><span className="wordmark small">Ella</span> The original AI Talent Tracker.</p>
          <p className="f-note">Statuses are drawn from public sources and describe roles, not availability. Inclusion is editorial and does not imply anyone is open to work.</p>
          <p className="f-credit">Built by <a href="https://jsn.io">Jason Schmidt</a>, who also appears on the Design list. <a href={REPO}>Open source on GitHub</a>.</p>
        </footer>
      </body>
    </html>
  );
}
