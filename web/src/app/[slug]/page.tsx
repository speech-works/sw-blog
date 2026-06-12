import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostSlugs } from "@/lib/queries";
import { urlForImage } from "@/lib/sanity.image";
import { byline, formatDate } from "@/lib/format";
import PortableBody from "@/components/PortableBody";

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

  const ogImage = post.coverImage
    ? urlForImage(post.coverImage).width(1200).height(630).fit("crop").url()
    : undefined;

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ogImage ? [ogImage] : undefined,
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

  return (
    <main className="relative mx-auto max-w-3xl px-5 pt-12 sm:px-6">
      <Link
        href="/"
        className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand"
      >
        ← All articles
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
            <img src={cover} alt={post.title} className="w-full" />
          </div>
        ) : null}

        <div className="mt-4">
          <PortableBody value={post.body} />
        </div>

        {post.author?.bio ? (
          <footer className="mt-16 rounded-3xl border border-black/5 bg-app-card p-6 shadow-soft-orange">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              About the author
            </p>
            <p className="mt-2 font-semibold text-app-title">
              {byline(post.author.name, post.author.credentials)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {post.author.bio}
            </p>
          </footer>
        ) : null}
      </article>
    </main>
  );
}
