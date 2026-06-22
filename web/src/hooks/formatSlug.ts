import type { FieldHook } from "payload";

// Turn a string into a URL-safe slug. Used to auto-fill the slug from the title
// when the author hasn't typed one (Payload has no built-in slug field type).
const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const formatSlug: FieldHook = ({ value, data, originalDoc }) => {
  if (typeof value === "string" && value.trim()) return slugify(value);
  const title = (data?.title ??
    (originalDoc as { title?: string } | undefined)?.title) as
    | string
    | undefined;
  if (typeof title === "string" && title.trim()) return slugify(title);
  return value;
};
