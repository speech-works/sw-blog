import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";

// Turns on Next draft mode (so pages can fetch unpublished drafts) — but ONLY for a
// logged-in Payload user. There is no secret in the URL to leak: access is gated by
// the admin session cookie, which is always present because previews are launched
// from /admin. WHICH drafts a viewer sees is then enforced by the page's
// access-respecting fetch, so an author can only ever preview their OWN drafts.
// Called by the admin Preview button + the Live Preview iframe.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "/";
  // Must be a single-leading-slash internal path. Reject protocol-relative
  // ("//host") and backslash ("/\\host") forms, which browsers treat as
  // off-site URLs — otherwise the redirect below becomes an open redirect.
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return new Response("That preview link doesn't look right. Please launch the preview from the admin.", {
      status: 400,
    });
  }

  const payload = await getPayloadClient();
  let user = null;
  try {
    ({ user } = await payload.auth({ headers: request.headers }));
  } catch {
    // fall through to the 401 below
  }
  if (!user) {
    return new Response("Sign in at /admin to preview drafts.", { status: 401 });
  }

  const dm = await draftMode();
  dm.enable();
  redirect(path);
}
