// Path that turns on draft mode and redirects to the post. Access is gated by the
// route itself (it checks the logged-in Payload user) — there is no secret in the
// URL to leak.
export function previewPath(slug?: unknown): string {
  const s = typeof slug === "string" && slug ? slug : "";
  const params = new URLSearchParams({ path: `/${s}` });
  return `/next/preview?${params.toString()}`;
}
