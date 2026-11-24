import Link from "next/link";
import type { Metadata } from "next";
import { SITE, ellaLd, ELLA_ID, abs } from "@/lib/data";
import { loadPosts, formatPostDate, postBanner } from "@/lib/blog";
import BlogSubscribe from "@/components/BlogSubscribe";

export const dynamic = "force-static";

export function generateMetadata(): Metadata {
  const title = "Blog";
  const description = "Notes from Ella on the people and lists she keeps.";
  const full = `${title} – Ella – AI Talent Tracker`;
  return {
    title,
    description,
    openGraph: { title: full, description, type: "website", url: abs("/blog") },
    twitter: { title: full, description },
    alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/feed.xml" } },
  };
}

export default function Page() {
  const posts = loadPosts();
  const unpublished = posts.some((p) => p.draft || p.example);
  const note = posts.some((p) => p.draft)
    ? "The posts below are drafts, not yet published."
    : "The posts below are example content, so you can see how this section will look. They are not published notes.";
  const ld = [
    ellaLd(),
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": SITE + "/blog#blog",
      url: SITE + "/blog",
      name: "Ella’s blog",
      description: "Notes from Ella on the people and lists she keeps.",
      inLanguage: "en",
      publisher: { "@id": ELLA_ID },
      isPartOf: { "@type": "WebSite", url: SITE + "/" },
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        "@id": SITE + "/blog/" + p.slug + "#post",
        headline: p.title,
        datePublished: p.date,
        url: SITE + "/blog/" + p.slug,
        description: p.excerpt,
        author: { "@type": "Person", name: "Ella", url: SITE + "/about" },
      })),
    },
  ];
  return (
    <section className="hero wrap compact blog blog-index">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="eyebrow">
        Blog <span className="blog-rss">· <a href="/blog/feed.xml">RSS</a></span>
      </p>
      <h1>Notes on talent</h1>
      <p className="lede">Short observations from watching the lists — and from the people on them.</p>
      {unpublished && (
        <p className="blog-example-note" role="note">
          {note}
        </p>
      )}
      {posts.length === 0 ? (
        <p className="blog-empty">No posts yet. The first one will appear here.</p>
      ) : (
        <ul className="blog-cards">
          {posts.map((p) => (
            <li key={p.slug} className="blog-card">
              {postBanner(p) && <p className="blog-example">{postBanner(p)}</p>}
              <p className="blog-card-meta">
                <time dateTime={p.date}>{formatPostDate(p.date)}</time>
                <span className="blog-tag">{p.category}</span>
              </p>
              <h2>
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h2>
              <p className="blog-excerpt">{p.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
      <BlogSubscribe />
    </section>
  );
}
