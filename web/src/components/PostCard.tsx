import Link from "next/link";
import type { PostListItem } from "@/lib/types";
import { urlForImage } from "@/lib/sanity.image";
import { byline, formatDate } from "@/lib/format";
import RoleBadge from "./RoleBadge";

export default function PostCard({ post }: { post: PostListItem }) {
  const cover = post.coverImage
    ? urlForImage(post.coverImage).width(800).height(480).fit("crop").url()
    : null;

  return (
    <Link
      href={`/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-app-card shadow-soft-orange transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
    >
      {cover ? (
        <div className="aspect-[5/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[5/3] bg-gradient-to-br from-brand-50 to-brand-100" />
      )}

      <div className="flex flex-1 flex-col p-6">
        {post.tags?.length ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <h2 className="text-xl font-bold leading-snug tracking-tight text-app-title transition-colors group-hover:text-brand-600">
          {post.title}
        </h2>

        {post.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-600">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium text-app-muted">
          {post.author?.name ? (
            <span className="text-app-text">
              {byline(post.author.name, post.author.credentials)}
            </span>
          ) : null}
          {post.author?.role ? <RoleBadge role={post.author.role} /> : null}
          {post.author?.name && post.publishedAt ? (
            <span aria-hidden>·</span>
          ) : null}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
