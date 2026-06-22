import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";

// Refresh the affected public pages the moment a post changes — in-process, no
// external webhook. `next/cache` is imported dynamically so it is only loaded at
// runtime (inside Next), never when the Payload CLI loads the config for type
// generation.
const pathsFor = (slug: unknown): string[] => {
  const list = ["/", "/sitemap.xml"];
  if (typeof slug === "string" && slug) list.push(`/${slug}`);
  return list;
};

export const revalidateAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
}) => {
  try {
    const { revalidatePath } = await import("next/cache");
    const slugs = new Set([
      ...pathsFor((doc as { slug?: unknown })?.slug),
      ...pathsFor((previousDoc as { slug?: unknown })?.slug),
    ]);
    for (const path of slugs) revalidatePath(path);
  } catch {
    // Outside a Next request context (CLI script / seed / migration) there is
    // nothing to revalidate — safely ignore.
  }
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
}) => {
  try {
    const { revalidatePath } = await import("next/cache");
    for (const path of pathsFor((doc as { slug?: unknown })?.slug)) {
      revalidatePath(path);
    }
  } catch {
    // No request context (CLI / seed / migration) — nothing to revalidate.
  }
  return doc;
};
