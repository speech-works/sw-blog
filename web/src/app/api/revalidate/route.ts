import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

// Sanity calls this on publish/unpublish. It purges the cached blog routes so the
// change appears within seconds, WITHOUT rebuilding this app or the landing site.
//
// Auth: a shared secret, passed either as `?secret=` or an `x-revalidate-secret`
// header, must match SANITY_REVALIDATE_SECRET. (Upgrade path: swap for Sanity's
// signed-webhook verification via @sanity/webhook if you want signature checks.)

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, message: "SANITY_REVALIDATE_SECRET is not set" },
      { status: 500 },
    );
  }

  const provided =
    req.nextUrl.searchParams.get("secret") ||
    req.headers.get("x-revalidate-secret");

  if (provided !== secret) {
    return NextResponse.json(
      { revalidated: false, message: "Invalid secret" },
      { status: 401 },
    );
  }

  // Refresh the whole blog subtree: index list + every post page. Cheap for a blog
  // and avoids guessing which paths a given publish affects.
  revalidatePath("/", "layout");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
