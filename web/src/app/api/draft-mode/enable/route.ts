import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/lib/sanity.client";
import { readToken } from "@/lib/env";

// Validates the secure preview URL (minted by the Studio's Presentation tool via
// @sanity/preview-url-secret) and turns on Next.js Draft Mode.
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: readToken }),
});
