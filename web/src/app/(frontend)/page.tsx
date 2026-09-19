import type { Metadata } from "next";
import { getAllPosts } from "@/lib/queries";
import { siteUrl, basePath, marketingUrl } from "@/lib/env";
import PostCard from "@/components/PostCard";
import { SectionEdge } from "@/components/SiteChrome";

// Time-based ISR: the index re-renders at most once a minute, and the publish
// webhook (/api/revalidate) refreshes it instantly. New posts never rebuild a repo.
export const revalidate = 60;

// Homepage-specific SEO. The layout sets the brand title template and canonical;
// here we override with keyword-led copy that carries both "stuttering" (US) and
// the UK/India spelling "stammering", plus "speech therapy" — the terms people
// actually type — so the index ranks for real search intent.
export const metadata: Metadata = {
  title: {
    absolute: "Stuttering & Stammering: Voices + SLP Insight | Speechworks",
  },
  description:
    "Real stories and evidence-based advice on stuttering and stammering, written by people who stutter and the speech-language pathologists who work beside them.",
  keywords: [
    "stuttering",
    "stammering",
    "people who stutter",
    "speech therapy",
    "speech-language pathologist",
    "SLP",
    "stuttering blog",
    "stammering blog",
  ],
  openGraph: {
    type: "website",
    siteName: "The Speechworks Blog",
    title: "Stuttering & stammering: voices from people who stutter and SLPs",
    description:
      "Writing on living with stuttering and stammering, by people who stutter and the SLPs who work with them.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stuttering & stammering: voices from people who stutter and SLPs",
    description:
      "Writing on living with stuttering and stammering, by people who stutter and the SLPs who work with them.",
  },
};

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  // Structured data so Google can model the site as a Blog published by the
  // Speechworks organization — improves entity understanding and rich results.
  const base = `${siteUrl}${basePath}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${base}/#organization`,
        name: "Speechworks",
        url: base,
        logo: {
          "@type": "ImageObject",
          url: `${marketingUrl}/assets/logo.png`,
        },
        email: "contact@speechworks.in",
        description:
          "Support for people who stutter and stammer, focused on confident everyday communication and a healthier relationship with stuttering rather than fluency alone.",
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: "The Speechworks Blog",
        inLanguage: "en",
        publisher: { "@id": `${base}/#organization` },
      },
      {
        "@type": "Blog",
        "@id": `${base}/#blog`,
        url: base,
        name: "The Speechworks Blog",
        description:
          "Writing on living with stuttering and stammering, by people who stutter and the speech-language pathologists who work with them.",
        inLanguage: "en",
        publisher: { "@id": `${base}/#organization` },
      },
    ],
  };

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="page-hero">
        <header className="blog-intro section-wrap">
          <p className="section-kicker">The Speechworks Blog</p>
          <h1>Voices on stuttering and stammering.</h1>
          <p className="blog-intro-copy">
            We write about stuttering and stammering as something to live with
            and speak through, not something to cure.
          </p>
          <p className="blog-intro-invite">
            Do you stutter, or work in speech therapy? We would love to publish
            your writing.{" "}
            <a
              href="mailto:contact@speechworks.in?subject=Writing%20for%20the%20Speechworks%20blog"
              className="ink-link"
            >
              Write with us
            </a>
            .
          </p>
        </header>
      </div>
      <SectionEdge />

      {posts.length === 0 ? (
        <div className="blog-empty">
          <h2>We are just getting started.</h2>
          <p>
            The first articles on stuttering, stammering, and speech therapy will
            appear here soon. If you would like to write one, get in touch.
          </p>
        </div>
      ) : (
        <div className="post-grid section-wrap">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}
