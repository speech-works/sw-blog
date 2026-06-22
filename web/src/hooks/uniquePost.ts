import type { CollectionBeforeValidateHook, PayloadRequest } from "payload";

// Turn a string into a URL-safe slug (Payload has no built-in slug field type).
const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

// Strip a trailing " (N)" / "-N" so duplicating an already-suffixed item increments
// cleanly ("Title (2)" -> "Title (3)") instead of stacking ("Title (2) (2)").
const stripTitleSuffix = (s: string): string => s.replace(/\s*\(\d+\)\s*$/, "").trim();
const stripSlugSuffix = (s: string): string => s.replace(/-\d+$/, "");

// First value no OTHER post is using. Tries `preferred` first (so an unchanged
// title/slug is kept), otherwise appends a numeric suffix to `base`. Uses
// overrideAccess so uniqueness is enforced across ALL authors + the whole system,
// including drafts.
async function firstFree(
  req: PayloadRequest,
  field: "title" | "slug",
  base: string,
  preferred: string,
  selfId: string | number | undefined,
  fmt: (b: string, n: number) => string,
): Promise<string> {
  const taken = async (val: string): Promise<boolean> => {
    const match = { [field]: { equals: val } };
    const where =
      selfId != null ? { and: [match, { id: { not_equals: selfId } }] } : match;
    const { totalDocs } = await req.payload.count({
      collection: "posts",
      where,
      overrideAccess: true,
    });
    return totalDocs > 0;
  };

  if (!(await taken(preferred))) return preferred;
  for (let n = 2; n <= 2000; n++) {
    const candidate = fmt(base, n);
    if (candidate !== preferred && !(await taken(candidate))) return candidate;
  }
  return fmt(base, 2000); // pathological fallback — never reached in practice
}

// Guarantee every post has a unique title AND slug across the whole system (all
// authors, including drafts). Duplicated posts and same-name attempts get a numeric
// suffix: "Title" -> "Title (2)" -> "Title (3)"; slug "title" -> "title-2" -> "title-3".
export const ensureUniquePost: CollectionBeforeValidateHook = async ({
  data,
  req,
  originalDoc,
}) => {
  if (!data) return data;
  const selfId = (originalDoc as { id?: string | number } | undefined)?.id;

  // Title — unique system-wide.
  if (typeof data.title === "string" && data.title.trim()) {
    const preferred = data.title.trim();
    const base = stripTitleSuffix(preferred) || preferred;
    data.title = await firstFree(
      req,
      "title",
      base,
      preferred,
      selfId,
      (b, n) => `${b} (${n})`,
    );
  }

  // Slug — from an explicit slug, else the (now-unique) title; then made unique.
  const rawSlug =
    typeof data.slug === "string" && data.slug.trim()
      ? data.slug
      : typeof data.title === "string"
        ? data.title
        : "";
  const slugged = slugify(rawSlug);
  if (slugged) {
    const base = stripSlugSuffix(slugged) || slugged;
    data.slug = await firstFree(
      req,
      "slug",
      base,
      slugged,
      selfId,
      (b, n) => `${b}-${n}`,
    );
  }

  return data;
};

export { slugify };
