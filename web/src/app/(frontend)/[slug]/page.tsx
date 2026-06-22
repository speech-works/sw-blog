import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { draftMode, headers } from "next/headers";
import { getPostBySlug, getPostDoc, getPostSlugs } from "@/lib/queries";
import { getPayloadClient } from "@/lib/payload";
import { resolveImage } from "@/lib/media";
import { siteUrl, basePath, marketingUrl } from "@/lib/env";
import PostArticle from "@/components/PostArticle";
import LivePostArticle from "@/components/LivePostArticle";
import PreviewBanner from "@/components/PreviewBanner";

export const revalidate = 60;
// Pre-render known slugs at build; render brand-new ones on first request (ISR).
export const dynamicParams = true;

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Metadata always reflects the published post (preview tab titles don't matter
  // and a draft fetch here would need the viewer's session).
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  // Use the post's cover when it has one; otherwise fall back to the site's
  // branded OG card so a cover-less post never shares as a blank preview.
  const ogImage =
    resolveImage(post.coverImage, "og")?.url ??
    `${siteUrl}${basePath}/opengraph-image`;

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `${basePath || ""}/${slug}` },
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}

const BackLink = () => (
  <Link
    href="/"
    className="group inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600 shadow-sm backdrop-blur transition-colors hover:border-brand/40 hover:text-brand"
  >
    <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
      ←
    </span>
    All articles
  </Link>
);

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const { isEnabled: isDraft } = await draftMode();

  // Preview: render the realtime client article (updates as you type, no DB hit).
  // Resolve the logged-in user so the draft fetch enforces access — an author
  // only ever sees their own drafts (an editor sees all). Not logged in → 404.
  if (isDraft) {
    const payload = await getPayloadClient();
    let user = null;
    try {
      ({ user } = await payload.auth({ headers: (await headers()) as unknown as Headers }));
    } catch {
      // not authenticated → treated as no access below
    }
    const doc = user ? await getPostDoc(slug, { draft: true, user }) : null;
    if (!doc) notFound();
    return (
      <main className="relative mx-auto max-w-3xl px-5 pt-12 sm:px-6 lg:max-w-6xl">
        <PreviewBanner />
        <BackLink />
        <LivePostArticle initialDoc={doc} />
      </main>
    );
  }

  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Article + breadcrumb structured data so Google can show rich results.
  const base = `${siteUrl}${basePath}`;
  const postUrl = `${base}/${slug}`;
  const coverUrl = resolveImage(post.coverImage, "cover")?.url;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${postUrl}#article`,
        headline: post.title,
        ...(post.excerpt ? { description: post.excerpt } : {}),
        ...(coverUrl ? { image: coverUrl } : {}),
        ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
        dateModified: post.updatedAt ?? post.publishedAt,
        ...(post.author?.name
          ? { author: { "@type": "Person", name: post.author.name } }
          : {}),
        publisher: {
          "@type": "Organization",
          "@id": `${base}/#organization`,
          name: "Speechworks",
          logo: {
            "@type": "ImageObject",
            url: `${marketingUrl}/assets/logo.png`,
          },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
        inLanguage: "en",
        ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Blog", item: `${base}/` },
          { "@type": "ListItem", position: 2, name: post.title, item: postUrl },
        ],
      },
    ],
  };

  return (
    <main className="relative mx-auto max-w-3xl px-5 pt-12 sm:px-6 lg:max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackLink />
      <PostArticle post={post} />
    </main>
  );
}
