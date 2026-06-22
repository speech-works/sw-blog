// Centralized public env for the blog front-end.

// The blog's OWN canonical origin (where this app is served). Drives metadataBase,
// canonical URLs, the sitemap/robots, and the OG image route — so social cards and
// search engines resolve to the blog, not the marketing site.
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://blog.speechworks.app";

// The marketing site origin. Used for shared-chrome assets (the logo) and the
// nav/footer back-links, which live on the main site rather than this blog.
export const marketingUrl =
  process.env.NEXT_PUBLIC_MARKETING_URL || "https://speechworks.app";

// URL prefix when the blog is mounted under a path (e.g. /blog); empty on the
// blog.speechworks.app subdomain.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
