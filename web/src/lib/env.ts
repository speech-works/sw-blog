// Centralized, validated access to public env. `isConfigured` lets pages render
// an empty-but-valid blog before the Sanity project exists (e.g. CI builds), so a
// missing projectId never hard-fails the build.

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://speechworks.app";
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const isConfigured = Boolean(projectId);
