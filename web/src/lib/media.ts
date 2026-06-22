import type { Media } from "@/payload-types";

export interface ResolvedImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

type SizeName = keyof NonNullable<Media["sizes"]>;

// Resolve a Payload upload into a renderable image, preferring a named resized
// variant (card / cover / og / small / medium / full / avatar) when present, else
// the original. Returns null when there's no usable image (an unpopulated id, or a
// missing file) so callers can simply render a fallback.
export function resolveImage(
  media: number | Media | null | undefined,
  size?: SizeName,
): ResolvedImage | null {
  if (!media || typeof media !== "object") return null;
  const variant = size ? media.sizes?.[size] : undefined;
  const url = variant?.url ?? media.url;
  if (!url) return null;
  return {
    url,
    width: variant?.width ?? media.width ?? undefined,
    height: variant?.height ?? media.height ?? undefined,
    alt: media.alt ?? undefined,
  };
}
