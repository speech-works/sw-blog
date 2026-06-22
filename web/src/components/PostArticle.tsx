"use client";
import { resolveImage } from "@/lib/media";
import { byline, formatDate, joinNames, readingTime } from "@/lib/format";
import RichText from "@/components/RichText";
import AuthorPanel from "@/components/AuthorPanel";
import RoleBadge from "@/components/RoleBadge";
import AudioPlayer from "@/components/AudioPlayer";
import type { Post } from "@/lib/types";

// The visible article (author rail + header + body + mobile footer). A client
// component so it can re-render live during preview (driven by LivePostArticle);
// on the public page it still server-renders, then hydrates.
export default function PostArticle({ post }: { post: Post }) {
  const cover = resolveImage(post.coverImage, "cover");
  const coverDims = cover ? { width: cover.width, height: cover.height } : null;
  const authorPhoto = resolveImage(post.author?.photo, "avatar")?.url ?? null;
  const authorInitial = post.author?.name?.trim().charAt(0).toUpperCase() ?? "";
  const minutes = readingTime(post.body);
  // Dereferenced references can be null (a deleted/missing author, or an empty
  // slot added while editing), so drop nulls before reading any fields.
  const authors = [
    ...(post.author ? [post.author] : []),
    ...(post.coAuthors ?? []),
  ].filter(Boolean);
  const coAuthorNames = joinNames(
    (post.coAuthors ?? []).filter(Boolean).map((a) => a.name),
  );
  const peerLabel = joinNames(
    (post.peerReviewers ?? [])
      .filter(Boolean)
      .map((r) => byline(r.name, r.credentials)),
  );

  return (
    <div className="mt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
      {post.author?.name ? (
        <AuthorPanel
          name={post.author.name}
          credentials={post.author.credentials}
          role={post.author.role}
          bio={post.author.bio}
          photoUrl={authorPhoto}
          audioUrl={post.audioUrl}
          withNames={coAuthorNames || undefined}
          className="hidden lg:block"
        />
      ) : (
        <div className="hidden lg:block" aria-hidden />
      )}

      <article className="lg:max-w-3xl">
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

          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm">
            {authors.map((a, i) => (
              <span
                key={`${a.name}-${i}`}
                className="inline-flex flex-wrap items-center gap-x-1.5"
              >
                {i > 0 ? <span className="text-app-muted">and</span> : null}
                <span className="font-semibold text-app-title">{a.name}</span>
                {a.credentials ? (
                  <span className="text-app-muted">· {a.credentials}</span>
                ) : null}
                {a.role ? <RoleBadge role={a.role} /> : null}
              </span>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-app-muted">
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            ) : null}
            {post.publishedAt ? <span aria-hidden>·</span> : null}
            <span>{minutes} min read</span>
            {peerLabel ? (
              <>
                <span aria-hidden>·</span>
                <span>Peer reviewed by {peerLabel}</span>
              </>
            ) : null}
          </div>
        </header>

        {cover ? (
          <div className="mt-8 overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.url}
              alt={post.title}
              width={coverDims?.width}
              height={coverDims?.height}
              className="h-auto w-full"
            />
          </div>
        ) : null}

        <div className="mt-4">
          <RichText data={post.body} />
        </div>

        {post.author?.name ? (
          <footer className="mt-16 flex items-start gap-5 rounded-[1.75rem] border border-black/5 bg-app-card p-6 shadow-soft-orange sm:p-7 lg:hidden">
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
                {post.author.name}
              </p>
              {post.author.credentials ? (
                <p className="text-sm text-app-muted">{post.author.credentials}</p>
              ) : null}
              {coAuthorNames ? (
                <p className="mt-1 text-sm text-app-muted">with {coAuthorNames}</p>
              ) : null}
              {post.author.role ? (
                <RoleBadge role={post.author.role} className="mt-2" />
              ) : null}
              {post.author.bio ? (
                <p className="mt-2 text-sm leading-relaxed text-app-muted">
                  {post.author.bio}
                </p>
              ) : null}
              {post.audioUrl ? (
                <div className="mt-4">
                  <AudioPlayer src={post.audioUrl} label="Listen to this article" />
                </div>
              ) : null}
            </div>
          </footer>
        ) : null}
      </article>
    </div>
  );
}
