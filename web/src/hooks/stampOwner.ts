import type { CollectionBeforeChangeHook } from "payload";

// On create, record WHO created the post. This is the anchor for the whole
// "an author can only touch their own posts" rule (see Posts access control).
// `owner` is a system-only field — nobody can set it by hand; this hook is the
// only thing that writes it.
export const stampOwner: CollectionBeforeChangeHook = ({
  data,
  req,
  operation,
}) => {
  if (operation === "create" && req.user) {
    const d = data as Record<string, unknown>;
    // Always the creator — even for Duplicate, which copies the source's owner.
    d.owner = req.user.id;
  }
  return data;
};
