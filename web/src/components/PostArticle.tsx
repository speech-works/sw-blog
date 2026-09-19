"use client";
import type { ReactNode } from "react";
import { resolveImage } from "@/lib/media";
import { byline, formatDate, joinNames, readingTime } from "@/lib/format";
import RichText from "@/components/RichText";
import AuthorPanel from "@/components/AuthorPanel";
import RoleBadge from "@/components/RoleBadge";
import AudioPlayer from "@/components/AudioPlayer";
import { SectionEdge } from "@/components/SiteChrome";
import type { Post } from "@/lib/types";

// The visible article: the orange opening band (title + byline), the speech
// edge, then the author rail + body + mobile author card. A client component so
// it can re-render live during preview (driven by LivePostArticle); on the
// public page it still server-renders, then hydrates. `lead` sits at the top of
// the band (the back link, and the preview banner while previewing).
export default function PostArticle({
  post,
  lead,
}: {
  post: Post;
  lead?: ReactNode;
}) {
  const cover = resolveImage(post.coverImage, "cover");
  const coverDims = cover ? { width: cover.width, height: cover.height } : null;
  const authorPhoto = resolveImage(post.author?.photo, "avatar")?.url ?? null;
  const authorInitial = post.author?.name?.trim().charAt(0).toUpperCase() ?? "";
  const minutes = readingTime(post.body);
  // Dereferenced references can be null (a deleted/missing author, or an empty
  // slot added while editing), and a user may not have set a name yet — drop both
  // so the byline never renders an empty name.
  const authors = [
    ...(post.author ? [post.author] : []),
    ...(post.coAuthors ?? []),
  ].filter((a) => Boolean(a?.name));
  const coAuthorNames = joinNames(
    (post.coAuthors ?? []).filter(Boolean).map((a) => a.name),
  );
  const peerLabel = joinNames(
    (post.peerReviewers ?? [])
      .filter(Boolean)
      .map((r) => byline(r.name, r.credentials)),
  );

  return (
    <article>
      <div className="page-hero">
        <header className="post-intro section-wrap">
          {lead}

          {post.tags?.length ? (
            <div className="tag-list">
              {post.tags.map((tag) => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <h1>{post.title}</h1>

          <div className="post-byline">
            {authors.map((a, i) => (
              <span key={`${a.name}-${i}`} className="post-author">
                {i > 0 ? <span>and</span> : null}
                <strong>{a.name}</strong>
                {a.credentials ? (
                  <span className="post-byline-credentials">
                    · {a.credentials}
                  </span>
                ) : null}
                {a.role ? <RoleBadge role={a.role} /> : null}
              </span>
            ))}
          </div>

          <div className="post-meta">
            {post.publishedAt ? (
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            ) : null}
            {post.publishedAt ? <span aria-hidden>·</span> : null}
            <span>{minutes} min read</span>
            {peerLabel ? (
              <span className="post-meta-peer">Peer reviewed by {peerLabel}</span>
            ) : null}
          </div>
        </header>
      </div>
      <SectionEdge />

      <div className="post-layout section-wrap">
        {post.author?.name ? (
          <AuthorPanel
            name={post.author.name}
            credentials={post.author.credentials}
            role={post.author.role}
            bio={post.author.bio}
            photoUrl={authorPhoto}
            audioUrl={post.audioUrl}
            withNames={coAuthorNames || undefined}
          />
        ) : (
          <div className="author-rail-spacer" aria-hidden />
        )}

        <div className="post-body">
          {cover ? (
            <div className="post-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover.url}
                alt={post.title}
                width={coverDims?.width}
                height={coverDims?.height}
              />
            </div>
          ) : null}

          <div className="prose-body">
            <RichText data={post.body} />
          </div>

          {post.author?.name ? (
            <footer className="author-card">
              {authorPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={authorPhoto}
                  alt={post.author.name}
                  className="author-photo"
                />
              ) : (
                <span aria-hidden className="author-photo author-initial">
                  {authorInitial}
                </span>
              )}
              <div>
                <p className="section-kicker" style={{ marginBottom: 6 }}>
                  About the author
                </p>
                <p className="author-name">{post.author.name}</p>
                {post.author.credentials ? (
                  <p className="author-detail">{post.author.credentials}</p>
                ) : null}
                {coAuthorNames ? (
                  <p className="author-detail">with {coAuthorNames}</p>
                ) : null}
                {post.author.role ? <RoleBadge role={post.author.role} /> : null}
                {post.author.bio ? (
                  <p className="author-bio">{post.author.bio}</p>
                ) : null}
                {post.audioUrl ? (
                  <div className="author-audio">
                    <AudioPlayer
                      src={post.audioUrl}
                      label="Listen to this article"
                    />
                  </div>
                ) : null}
              </div>
            </footer>
          ) : null}
        </div>
      </div>
    </article>
  );
}
