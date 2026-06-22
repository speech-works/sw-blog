import type { Media, Post as PayloadPost } from "@/payload-types";
import type { AuthorRole } from "./roles";

export type { AuthorRole };

// A reference to an uploaded image — either the populated Media doc or its id.
export type ImageRef = number | Media | null | undefined;
// The post body is Lexical editor state (rendered by components/RichText).
export type LexicalBody = PayloadPost["body"];

export interface Author {
  name: string;
  credentials?: string;
  photo?: ImageRef;
  bio?: string;
  role?: AuthorRole; // the public badge (mapped from the user's contributorType)
}

export interface PostListItem {
  id: number | string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: ImageRef;
  publishedAt?: string;
  tags?: string[];
  author?: Pick<Author, "name" | "credentials" | "role">;
}

export interface Post extends PostListItem {
  body?: LexicalBody;
  updatedAt?: string;
  author?: Author;
  coAuthors?: Pick<Author, "name" | "credentials" | "role">[];
  peerReviewers?: Pick<Author, "name" | "credentials">[];
  audioUrl?: string;
}
