import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { client } from "./sanity.client";

const builder = createImageUrlBuilder(client);

// Sanity's CDN resizes on demand via URL params, so we ask for exactly the width
// we render and skip Next image optimization entirely (host-agnostic on Cloudflare).
export function urlForImage(source: SanityImageSource) {
  return builder.image(source).auto("format").fit("max");
}

// True when an image value has an uploaded asset. Image blocks/fields can exist
// without one (an empty field, or one mid-upload during live editing); urlForImage
// throws on those, so always guard with this first.
export function hasAsset(source: unknown): boolean {
  return Boolean((source as { asset?: unknown } | null | undefined)?.asset);
}

// A Sanity image asset _ref encodes the original pixel size ("...-1600x1164-jpg").
// Parsing it lets us set width/height on the <img> so the browser reserves the box
// before the image loads, preventing layout shift (CLS).
export function imageDimensions(
  source: unknown,
): { width: number; height: number } | null {
  const ref =
    (source as { asset?: { _ref?: string } } | null)?.asset?._ref ??
    (source as { _ref?: string } | null)?._ref;
  const match = /-(\d+)x(\d+)-/.exec(typeof ref === "string" ? ref : "");
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}
