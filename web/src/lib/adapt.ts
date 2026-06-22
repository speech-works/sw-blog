// Pure adapters: Payload docs -> the lightweight shapes the UI renders. No server
// imports, so this is safe to use on the client (the live-preview component needs
// it to adapt live data) as well as in the server data layer.
import type { Author, Post, PostListItem } from "./types";
import type { Post as PayloadPost, User } from "@/payload-types";

// A populated user becomes the public byline; contributorType becomes the badge.
export function toAuthor(u: number | User | null | undefined): Author | undefined {
  if (!u || typeof u !== "object") return undefined;
  return {
    name: u.name,
    credentials: u.credentials ?? undefined,
    role: (u.contributorType ?? undefined) as Author["role"],
    photo: u.photo,
    bio: u.bio ?? undefined,
  };
}

export function toAuthors(
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

export function toListItem(doc: PayloadPost): PostListItem {
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

export function toPost(doc: PayloadPost): Post {
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
