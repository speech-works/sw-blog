import Link from "next/link";
import type { PostListItem } from "@/lib/types";
import { resolveImage } from "@/lib/media";
import { byline, formatDate } from "@/lib/format";
import RoleBadge from "./RoleBadge";

// Cards cycle through the site's program-card tones so the grid reads like the
// program catalog on speechworks.app.
const TONES = ["tone-blue", "tone-orange", "tone-purple", "tone-lime"];

export default function PostCard({
  post,
  index = 0,
}: {
  post: PostListItem;
  index?: number;
}) {
  const cover = resolveImage(post.coverImage, "card")?.url ?? null;

  return (
    <Link
      href={`/${post.slug}`}
      className={`post-card ${TONES[index % TONES.length]}`}
    >
      {cover ? (
        <div className="post-card-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt={post.title} loading="lazy" />
        </div>
      ) : null}

      <div className="post-card-body">
        {post.tags?.length ? (
          <div className="tag-list">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <h2>{post.title}</h2>

        {post.excerpt ? (
          <p className="post-card-excerpt">{post.excerpt}</p>
        ) : null}

        <div className="post-card-meta">
          {post.author?.name ? (
            <div className="post-card-author">
              <span>{byline(post.author.name, post.author.credentials)}</span>
              {post.author.role ? <RoleBadge role={post.author.role} /> : null}
            </div>
          ) : null}
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
          ) : null}
        </div>
        <span className="post-card-read">
          Read article <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
