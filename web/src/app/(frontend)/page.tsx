import type { Metadata } from "next";
import { getAllPosts } from "@/lib/queries";
import { siteUrl, basePath, marketingUrl } from "@/lib/env";
import PostCard from "@/components/PostCard";

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
    <main className="relative mx-auto max-w-6xl px-5 pt-14 sm:px-6 lg:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
          The Speechworks Blog
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-app-title md:text-5xl">
          Voices on stuttering and stammering
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-gray-600">
          We write about stuttering and
          stammering as something to live with and speak through, not something
          to cure.
        </p>
        <p className="mt-6 text-base text-gray-600">
          Do you stutter, or work in speech therapy? We would love to publish
          your writing.{" "}
          <a
            href="mailto:contact@speechworks.in?subject=Writing%20for%20the%20Speechworks%20blog"
            className="font-semibold text-brand-600 underline decoration-brand/30 underline-offset-2 transition-colors hover:text-brand"
          >
            Write with us
          </a>
          .
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="mx-auto mt-16 max-w-md rounded-3xl border border-dashed border-brand/30 bg-brand-50/50 p-10 text-center">
          <p className="text-lg font-semibold text-app-title">
            We are just getting started
          </p>
          <p className="mt-2 text-sm text-app-muted">
            The first articles on stuttering, stammering, and speech therapy will
            appear here soon. If you would like to write one, get in touch.
          </p>
        </div>
      ) : (
        <div className="mt-14 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
