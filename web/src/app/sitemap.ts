import type { MetadataRoute } from "next";
import { getAllPostMeta } from "@/lib/queries";
import { siteUrl, basePath } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = `${siteUrl}${basePath}`;
  const posts = await getAllPostMeta();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: `${base}/`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...postEntries,
  ];
}
