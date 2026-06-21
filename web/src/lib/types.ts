import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url";

export type AuthorRole = "pws" | "slp" | "parent" | "researcher" | "ally";

export interface Author {
  name: string;
  credentials?: string;
  photo?: SanityImageSource;
  bio?: string;
  role?: AuthorRole;
}

export interface PostListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: SanityImageSource;
  publishedAt?: string;
  tags?: string[];
  author?: Pick<Author, "name" | "credentials" | "role">;
}

export interface Post extends PostListItem {
  body: PortableTextBlock[];
  _updatedAt?: string;
  author?: Author;
  coAuthors?: Pick<Author, "name" | "credentials" | "role">[];
  peerReviewers?: Pick<Author, "name" | "credentials">[];
  audioUrl?: string;
}
