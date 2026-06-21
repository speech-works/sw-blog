import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { client } from "./sanity.client";

const builder = createImageUrlBuilder(client);

// Sanity's CDN resizes on demand via URL params, so we ask for exactly the width
// we render and skip Next image optimization entirely (host-agnostic on Cloudflare).
export function urlForImage(source: SanityImageSource) {
  return builder.image(source).auto("format").fit("max");
}
