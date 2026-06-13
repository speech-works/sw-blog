import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostSlugs } from "@/lib/queries";
import { urlForImage } from "@/lib/sanity.image";
import { siteUrl, basePath } from "@/lib/env";
import { byline, formatDate } from "@/lib/format";
import PortableBody from "@/components/PortableBody";

// A Sanity image asset _ref encodes the original pixel size ("...-1600x1164-jpg").
// Parsing it lets us set width/height on the <img> so the browser reserves the box
// before the image loads, preventing the article from shifting down (CLS).
function imageDimensions(
  source: unknown,
): { width: number; height: number } | null {
  const ref =
    (source as { asset?: { _ref?: string } } | null)?.asset?._ref ??
    (source as { _ref?: string } | null)?._ref;
  const match = /-(\d+)x(\d+)-/.exec(typeof ref === "string" ? ref : "");
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

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
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  // Use the post's cover when it has one; otherwise fall back to the site's
  // branded OG card so a cover-less post never shares as a blank preview.
  const ogImage = post.coverImage
    ? urlForImage(post.coverImage).width(1200).height(630).fit("crop").url()
    : `${siteUrl}${basePath}/opengraph-image`;

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
      modifiedTime: post._updatedAt,
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

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const cover = post.coverImage
    ? urlForImage(post.coverImage).width(1600).url()
    : null;
  const coverDims = post.coverImage ? imageDimensions(post.coverImage) : null;

  // Author photo is optional: show it when the author has one, otherwise fall back
  // to a brand-tinted initial so the card always looks intentional.
  const authorPhoto = post.author?.photo
    ? urlForImage(post.author.photo).width(160).height(160).fit("crop").url()
    : null;
  const authorInitial =
    post.author?.name?.trim().charAt(0).toUpperCase() ?? "";

  // Article + breadcrumb structured data so Google can show rich results for a
  // post (headline, author, dates, breadcrumb). Built only from the post's own
  // fields; publisher points at the Organization defined on the homepage.
  const base = `${siteUrl}${basePath}`;
  const postUrl = `${base}/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${postUrl}#article`,
        headline: post.title,
        ...(post.excerpt ? { description: post.excerpt } : {}),
        ...(cover ? { image: cover } : {}),
        ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
        dateModified: post._updatedAt ?? post.publishedAt,
        ...(post.author?.name
          ? { author: { "@type": "Person", name: post.author.name } }
          : {}),
        publisher: {
          "@type": "Organization",
          "@id": `${base}/#organization`,
          name: "Speechworks",
          logo: {
            "@type": "ImageObject",
            url: `${siteUrl}/assets/logo.png`,
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
    <main className="relative mx-auto max-w-3xl px-5 pt-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/"
        className="group inline-flex items-center gap-2 rounded-full border border-brand/20 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600 shadow-sm backdrop-blur transition-colors hover:border-brand/40 hover:text-brand"
      >
        <span aria-hidden className="transition-transform group-hover:-translate-x-0.5">
          ←
        </span>
        All articles
      </Link>

      <article className="mt-8">
        <header>
          {post.tags?.length ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-app-title md:text-4xl">
            {post.title}
          </h1>

          <div className="mt-5 flex items-center gap-3 text-sm text-app-muted">
            {post.author?.name ? (
              <span className="font-semibold text-app-text">
                {byline(post.author.name, post.author.credentials)}
              </span>
            ) : null}
            {post.author?.name && post.publishedAt ? <span>·</span> : null}
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            ) : null}
          </div>
        </header>

        {cover ? (
          <div className="mt-8 overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={post.title}
              width={coverDims?.width}
              height={coverDims?.height}
              className="h-auto w-full"
            />
          </div>
        ) : null}

        <div className="mt-4">
          <PortableBody value={post.body} />
        </div>

        {post.author?.name ? (
          <footer className="mt-16 flex items-start gap-5 rounded-[1.75rem] border border-black/5 bg-app-card p-6 shadow-soft-orange sm:p-7">
            {authorPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={authorPhoto}
                alt={post.author.name}
                className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-black/5"
              />
            ) : (
              <span
                aria-hidden
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-600 ring-1 ring-black/5"
              >
                {authorInitial}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-600">
                About the author
              </p>
              <p className="mt-1.5 text-base font-bold text-app-title">
                {byline(post.author.name, post.author.credentials)}
              </p>
              {post.author.bio ? (
                <p className="mt-2 text-sm leading-relaxed text-app-muted">
                  {post.author.bio}
                </p>
              ) : null}
            </div>
          </footer>
        ) : null}
      </article>
    </main>
  );
}
