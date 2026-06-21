import { defineLive } from "next-sanity/live";
import { client } from "./sanity.client";
import { readToken } from "./env";

// Live Content API. `sanityFetch` returns content that auto-refreshes when the
// dataset changes, and serves drafts in Draft Mode via the read token;
// `<SanityLive />` (mounted once in the root layout) wires up the subscription.
// A recent apiVersion is pinned here because the Live API requires it.
export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({ apiVersion: "2025-02-19" }),
  serverToken: readToken,
  browserToken: readToken,
});
