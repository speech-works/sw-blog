import { sanityFetch } from "./sanity.live";
import { isConfigured } from "./env";
import type { Post, PostListItem } from "./types";

// sanityFetch (Live Content API) serves published content by default and swaps in
// drafts automatically when Draft Mode is on (via the read token in sanity.live).

const listFields = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage,
  publishedAt,
  tags,
  author->{ name, credentials, role }
`;

const allPostsQuery = `*[_type == "post" && defined(slug.current)]
  | order(publishedAt desc) { ${listFields} }`;

const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0]{
  ${listFields},
  body,
  _updatedAt,
  author->{ name, credentials, photo, bio, role },
  coAuthors[]->{ name, credentials, role },
  peerReviewers[]->{ name, credentials },
  audioUrl
}`;

const slugsQuery = `*[_type == "post" && defined(slug.current)].slug.current`;

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
