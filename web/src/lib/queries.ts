import { client } from "./sanity.client";
import { isConfigured } from "./env";
import type { Post, PostListItem } from "./types";

// The client uses the "published" perspective, so drafts and in-review documents
// are never returned. A post is public only once an editor hits Publish in Studio.

const listFields = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  coverImage,
  publishedAt,
  tags,
  author->{ name, credentials }
`;

const allPostsQuery = `*[_type == "post" && defined(slug.current)]
  | order(publishedAt desc) { ${listFields} }`;

const postBySlugQuery = `*[_type == "post" && slug.current == $slug][0]{
  ${listFields},
  body,
  _updatedAt,
  author->{ name, credentials, photo, bio }
}`;

const slugsQuery = `*[_type == "post" && defined(slug.current)].slug.current`;

export async function getAllPosts(): Promise<PostListItem[]> {
  if (!isConfigured) return [];
  try {
    return await client.fetch(allPostsQuery);
  } catch (err) {
    console.error("[sw-blog] getAllPosts failed:", err);
    return [];
  }
}

export async function getPostSlugs(): Promise<string[]> {
  if (!isConfigured) return [];
  try {
    return await client.fetch(slugsQuery);
  } catch (err) {
    console.error("[sw-blog] getPostSlugs failed:", err);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isConfigured) return null;
  try {
    return await client.fetch(postBySlugQuery, { slug });
  } catch (err) {
    console.error("[sw-blog] getPostBySlug failed:", err);
    return null;
  }
}
