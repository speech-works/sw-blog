import type { PortableTextBlock } from "@portabletext/types";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export interface Author {
  name: string;
  credentials?: string;
  photo?: SanityImageSource;
  bio?: string;
}

export interface PostListItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: SanityImageSource;
  publishedAt?: string;
  tags?: string[];
  author?: Pick<Author, "name" | "credentials">;
}

export interface Post extends PostListItem {
  body: PortableTextBlock[];
  _updatedAt?: string;
  author?: Author;
}
