// Shared between the Payload admin (which builds the preview URL) and the Next
// preview route (which verifies it). A real secret is set in production via
// PREVIEW_SECRET; locally it falls back to a fixed dev value so preview works
// without extra setup.
export const PREVIEW_SECRET = process.env.PREVIEW_SECRET || "dev-preview-secret";

// Path that enables Next draft mode and redirects to the post.
export function previewPath(slug?: unknown): string {
  const s = typeof slug === "string" && slug ? slug : "";
  const params = new URLSearchParams({
    previewSecret: PREVIEW_SECRET,
    path: `/${s}`,
  });
  return `/next/preview?${params.toString()}`;
}
