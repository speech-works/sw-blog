import { getPayloadClient, dbConfigured } from "./payload";
import { toListItem, toPost } from "./adapt";
import type { Post, PostListItem } from "./types";
import type { Post as PayloadPost } from "@/payload-types";

const PUBLISHED = { _status: { equals: "published" } } as const;

export async function getAllPosts(): Promise<PostListItem[]> {
  if (!dbConfigured()) return [];
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      where: PUBLISHED,
      sort: "-publishedAt",
      depth: 1,
      limit: 100,
    });
    return res.docs.map(toListItem);
  } catch (err) {
    console.error("[sw-blog] getAllPosts failed:", err);
    return [];
  }
}

// Raw post document (used by the live-preview component, which needs the Payload
// shape to merge with live editor data). In preview it returns the latest draft.
export async function getPostDoc(
  slug: string,
  opts: { draft?: boolean } = {},
): Promise<PayloadPost | null> {
  if (!dbConfigured()) return null;
  const draft = Boolean(opts.draft);
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      where: draft
        ? { slug: { equals: slug } }
        : { and: [{ slug: { equals: slug } }, PUBLISHED] },
      draft,
      depth: 2, // populate author.photo, cover, co-authors, peer reviewers, body images
      limit: 1,
    });
    return res.docs[0] ?? null;
  } catch (err) {
    console.error("[sw-blog] getPostDoc failed:", err);
    return null;
  }
}

export async function getPostBySlug(
  slug: string,
  opts: { draft?: boolean } = {},
): Promise<Post | null> {
  const doc = await getPostDoc(slug, opts);
  return doc ? toPost(doc) : null;
}

export async function getPostSlugs(): Promise<string[]> {
  if (!dbConfigured()) return [];
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      where: PUBLISHED,
      depth: 0,
      limit: 1000,
      pagination: false,
    });
    return res.docs.map((d) => d.slug).filter(Boolean);
  } catch (err) {
    console.error("[sw-blog] getPostSlugs failed:", err);
    return [];
  }
}

export async function getAllPostMeta(): Promise<
  { slug: string; publishedAt?: string }[]
> {
  if (!dbConfigured()) return [];
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      where: PUBLISHED,
      sort: "-publishedAt",
      depth: 0,
      limit: 1000,
      pagination: false,
    });
    return res.docs.map((d) => ({
      slug: d.slug,
      publishedAt: d.publishedAt ?? undefined,
    }));
  } catch (err) {
    console.error("[sw-blog] getAllPostMeta failed:", err);
    return [];
  }
}
