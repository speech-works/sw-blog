import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { PREVIEW_SECRET } from "@/lib/preview";

// Enables Next draft mode (so pages fetch unpublished drafts) after verifying the
// secret, then redirects to the post. Called by the admin Preview button + the
// Live Preview iframe.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("previewSecret");
  const path = searchParams.get("path") || "/";

  if (secret !== PREVIEW_SECRET) {
    return new Response("Invalid preview secret.", { status: 401 });
  }
  if (!path.startsWith("/")) {
    return new Response("Invalid preview path.", { status: 400 });
  }

  const dm = await draftMode();
  dm.enable();
  redirect(path);
}
