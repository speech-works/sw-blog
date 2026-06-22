import type { MetadataRoute } from "next";
import { siteUrl, basePath } from "@/lib/env";

// Without this route Next serves no robots.txt, so crawlers fall back to their
// defaults and never learn where the sitemap lives. Allow everything and point
// them at it. basePath keeps the URL correct on the subdomain fallback.
export default function robots(): MetadataRoute.Robots {
  const base = `${siteUrl}${basePath}`;
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
