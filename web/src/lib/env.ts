// Centralized, validated access to public env. `isConfigured` lets pages render
// an empty-but-valid blog before the Sanity project exists (e.g. CI builds), so a
// missing projectId never hard-fails the build.

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01";

// The blog's OWN canonical origin (where this app is served). Drives metadataBase,
// canonical URLs, the sitemap/robots, and the OG image route — so social cards and
// search engines resolve to the blog, not the marketing site.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://blog.speechworks.app";
// The marketing site origin. Used for shared-chrome assets (the logo) and the
// nav/footer back-links, which live on the main site rather than this blog.
export const marketingUrl =
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://speechworks.app";
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const isConfigured = Boolean(projectId);
