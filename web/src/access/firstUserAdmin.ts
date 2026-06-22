import type { FieldHook } from "payload";

// The very first account created (via /admin/create-first-user) becomes the admin
// automatically, so there's always someone who can grant roles. Every later account
// keeps whatever role it was given (default: author).
//
// Pairs with the roles field's `create` access (below), which permits this bootstrap
// write because no users exist yet. Without that, the admin-only field access would
// strip this value during the unauthenticated first-user creation.
export const firstUserAdmin: FieldHook = async ({ req, operation, value }) => {
  if (operation !== "create") return value;
  const { totalDocs } = await req.payload.count({ collection: "users" });
  return totalDocs === 0 ? ["admin"] : value;
};
