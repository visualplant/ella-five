import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE, SITE_URL, ellaLd, ELLA_ID, abs } from "@/lib/data";
import { breadcrumbLd } from "@/lib/seo";
import { loadPosts, getPost, formatPostDate, postBanner } from "@/lib/blog";
import BlogSubscribe from "@/components/BlogSubscribe";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return loadPosts().map((p) => ({ slug: p.slug }));
}

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  const description = p.excerpt;
  const title = p.title;
  const full = `${title} – Ella – AI Talent Tracker`;
  return {
    title,
    description,
    authors: [{ name: "Ella", url: abs("/about") }],
    openGraph: {
      title: full,
      description,
      type: "article",
      url: abs(`/blog/${p.slug}`),
      publishedTime: p.date,
      authors: ["Ella"],
    },
    twitter: { card: "summary_large_image", title: full, description },
    alternates: { canonical: `/blog/${p.slug}`, types: { "application/rss+xml": "/blog/feed.xml" } },
  };
}

export default async function Page({ params }: P) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();
  const url = SITE + "/blog/" + p.slug;
  const crumbs = breadcrumbLd([
    { name: "Home", url: SITE_URL },
    { name: "Blog", url: abs("/blog") },
    { name: p.title },
  ]);
  const ld = [
    ellaLd(),
    crumbs,
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": url + "#post",
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      headline: p.title,
      description: p.excerpt,
      datePublished: p.date,
      url,
      inLanguage: "en",
      image: SITE + "/blog/" + p.slug + "/opengraph-image",
      author: { "@id": ELLA_ID },
      publisher: { "@id": ELLA_ID },
      isPartOf: { "@type": "Blog", "@id": SITE + "/blog#blog", name: "Ella’s blog", url: SITE + "/blog" },
      articleSection: p.category,
      ...(p.draft ? { creativeWorkStatus: "Draft" } : p.example ? { creativeWorkStatus: "Placeholder" } : {}),
    },
  ];
  return (
    <article className="hero wrap compact blog blog-post">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="eyebrow">
        <Link href="/blog">Blog</Link>
      </p>
      {postBanner(p) && <p className="blog-example">{postBanner(p)}</p>}
      <h1>{p.title}</h1>
      <p className="blog-byline">
        <img src="/ella.webp" alt="" width="40" height="40" className="avatar" />
        <span>
          <span className="blog-author">Ella</span>
          <span className="blog-byline-meta">
            <time dateTime={p.date}>{formatPostDate(p.date)}</time>
            <span className="blog-tag">{p.category}</span>
          </span>
        </span>
      </p>
      <div className="blog-body" dangerouslySetInnerHTML={{ __html: p.html }} />
      {p.related.length > 0 && (
        <aside className="blog-related" aria-labelledby="blog-related-h">
          <h2 id="blog-related-h">Related lists</h2>
          <ul>
            {p.related.map((r) => (
              <li key={r.slug}>
                <Link href={r.href}>{r.name}</Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
      <BlogSubscribe />
      <Link href="/blog" className="back">
        ← All posts
      </Link>
    </article>
  );
}
