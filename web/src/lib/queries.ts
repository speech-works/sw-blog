import { sanityFetch } from "./sanity.live";
import { isConfigured } from "./env";
import type { Post, PostListItem } from "./types";

// sanityFetch (Live Content API) serves published content by default and swaps in
// drafts automatically when Draft Mode is on (via the read token in sanity.live).

// Shared scalar fields. `author` is projected per-query (the list needs less than
// the detail view), so it is NOT included here to avoid a double projection.
const listFields = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage,
  publishedAt,
  tags
`;

const allPostsQuery = `*[_type == "post" && defined(slug.current)]
  | order(publishedAt desc) { ${listFields}, author->{ name, credentials, role } }`;

const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0]{
  ${listFields},
  body,
  _updatedAt,
  author->{ name, credentials, photo, bio, role },
  coAuthors[]->{ name, credentials, role },
  peerReviewers[]->{ name, credentials },
  "audioUrl": coalesce(audio.asset->url, audioUrl)
}`;

const slugsQuery = `*[_type == "post" && defined(slug.current)].slug.current`;

// Lean projection for the sitemap (and any slug+date use) — avoids pulling cover
// images, authors, etc. on a route that doesn't render them.
const postMetaQuery = `*[_type == "post" && defined(slug.current)]
  | order(publishedAt desc) { "slug": slug.current, publishedAt }`;

export async function getAllPosts(): Promise<PostListItem[]> {
  if (!isConfigured) return [];
  try {
    const { data } = await sanityFetch({ query: allPostsQuery });
    return (data as PostListItem[]) ?? [];
  } catch (err) {
    console.error("[sw-blog] getAllPosts failed:", err);
    return [];
  }
}

export async function getPostSlugs(): Promise<string[]> {
  if (!isConfigured) return [];
  try {
    // Build-time: force published + no stega (these power generateStaticParams).
    const { data } = await sanityFetch({
      query: slugsQuery,
      perspective: "published",
      stega: false,
    });
    return (data as string[]) ?? [];
  } catch (err) {
    console.error("[sw-blog] getPostSlugs failed:", err);
    return [];
  }
}

export async function getAllPostMeta(): Promise<
  { slug: string; publishedAt?: string }[]
> {
  if (!isConfigured) return [];
  try {
    const { data } = await sanityFetch({
      query: postMetaQuery,
      perspective: "published",
      stega: false,
    });
    return (data as { slug: string; publishedAt?: string }[]) ?? [];
  } catch (err) {
    console.error("[sw-blog] getAllPostMeta failed:", err);
    return [];
  }
}

export async function getPostBySlug(
  slug: string,
  { stega = true }: { stega?: boolean } = {},
): Promise<Post | null> {
  if (!isConfigured) return null;
  try {
    // stega is disabled for metadata so encoded markers never leak into <title>.
    const { data } = await sanityFetch({
      query: postBySlugQuery,
      params: { slug },
      stega,
    });
    return (data as Post) ?? null;
  } catch (err) {
    console.error("[sw-blog] getPostBySlug failed:", err);
    return null;
  }
}
