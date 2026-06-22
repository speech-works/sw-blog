import { getPayloadClient, dbConfigured } from "./payload";
import type { Author, Post, PostListItem } from "./types";
import type { Post as PayloadPost, User } from "@/payload-types";

// --- adapters: Payload docs -> the lightweight shapes the UI renders ---

// A populated user becomes the public byline; its `contributorType` becomes the
// public `role` badge.
function toAuthor(u: number | User | null | undefined): Author | undefined {
  if (!u || typeof u !== "object") return undefined;
  return {
    name: u.name,
    credentials: u.credentials ?? undefined,
    role: (u.contributorType ?? undefined) as Author["role"],
    photo: u.photo,
    bio: u.bio ?? undefined,
  };
}

function toAuthors(
  list: (number | User)[] | null | undefined,
): Pick<Author, "name" | "credentials" | "role">[] {
  return (list ?? [])
    .filter((u): u is User => Boolean(u) && typeof u === "object")
    .map((u) => ({
      name: u.name,
      credentials: u.credentials ?? undefined,
      role: (u.contributorType ?? undefined) as Author["role"],
    }));
}

function toListItem(doc: PayloadPost): PostListItem {
  const a = toAuthor(doc.author);
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt ?? undefined,
    coverImage: doc.coverImage,
    publishedAt: doc.publishedAt ?? undefined,
    tags: doc.tags ?? undefined,
    author: a
      ? { name: a.name, credentials: a.credentials, role: a.role }
      : undefined,
  };
}

function toPost(doc: PayloadPost): Post {
  const uploaded =
    doc.audio && typeof doc.audio === "object" ? doc.audio.url : undefined;
  return {
    ...toListItem(doc),
    body: doc.body,
    updatedAt: doc.updatedAt ?? undefined,
    author: toAuthor(doc.author),
    coAuthors: toAuthors(doc.coAuthors),
    peerReviewers: toAuthors(doc.peerReviewers).map(({ name, credentials }) => ({
      name,
      credentials,
    })),
    audioUrl: uploaded ?? doc.audioUrl ?? undefined,
  };
}

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

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!dbConfigured()) return null;
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      where: { and: [{ slug: { equals: slug } }, PUBLISHED] },
      depth: 2, // populate author.photo, cover, co-authors, peer reviewers, body images
      limit: 1,
    });
    const doc = res.docs[0];
    return doc ? toPost(doc) : null;
  } catch (err) {
    console.error("[sw-blog] getPostBySlug failed:", err);
    return null;
  }
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
