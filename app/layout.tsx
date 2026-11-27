import NavLink from "@/components/NavLink";
import HeaderSubscribe from "@/components/HeaderSubscribe";
import HeaderSearch from "@/components/HeaderSearch";
import { weeks } from "@/lib/weekly";
import GitHubMark from "@/components/GitHubMark";
import Wordmark from "@/components/Wordmark";
import type { Metadata, Viewport } from "next";
import { Newsreader, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE, REPO, categories } from "@/lib/data";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], variable: "--serif", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Ella – AI Talent Tracker: AI people to follow", template: "%s – Ella – AI Talent Tracker" },
  description: "A short, sourced, regularly updated list of exceptional people in AI across Technical, Design, Research, Product and Growth.",
  openGraph: { type: "website", url: SITE + "/", siteName: "Ella", title: "Ella – AI Talent Tracker: AI people to follow", description: "Five people, five disciplines, every status sourced." },
  twitter: { card: "summary_large_image", title: "Ella – AI Talent Tracker: AI people to follow", description: "Five people, five disciplines, every status sourced." },
};
export const viewport: Viewport = { themeColor: "#f6f3ee" };

function safeHasWeeks() { try { return weeks().length > 0; } catch { return false; } }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <head>
          <link rel="alternate" type="application/rss+xml" title="Ella – archived lists" href="/feed.xml" />
          <link rel="alternate" type="application/rss+xml" title="Ella – blog" href="/blog/feed.xml" />
        </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <header className="site-header wrap">
          <Wordmark />
          <div className="header-end">
            <HeaderSearch variant="nav" />
            <nav aria-label="Categories">
              <ul><li className="nav-home"><Link href="/" aria-label="5x5: all five lists">5x5</Link></li>{categories.map((c) => <li key={c.slug}><NavLink slug={c.slug} name={c.name} /></li>)}</ul>
            </nav>
            <HeaderSubscribe variant="nav" />
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer wrap">
          <p className="f-brand"><Link href="/about">Ella <span>– AI Talent Tracker</span></Link></p>
          <p className="f-note">Statuses are drawn from public sources and describe roles, not availability. Inclusion is editorial and does not imply anyone is open to work.</p>
          <GitHubMark archive={safeHasWeeks()} />
        </footer>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
