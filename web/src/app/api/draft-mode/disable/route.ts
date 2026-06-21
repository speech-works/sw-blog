import { draftMode } from "next/headers";
import { NextResponse } from "next/server";
import { basePath } from "@/lib/env";

// next-sanity 13 ships defineEnableDraftMode but not a disable helper, so this is
// the manual equivalent: turn Draft Mode off and return to the homepage.
export async function GET(request: Request) {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL(`${basePath}/`, request.url));
}
