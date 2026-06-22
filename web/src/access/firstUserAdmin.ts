import type { FieldHook } from "payload";

// The very first account created (via /admin/create-first-user) becomes the
// admin automatically, so there's always someone who can grant roles. Every
// later account keeps whatever role it was given (default: author).
export const firstUserAdmin: FieldHook = async ({ req, operation, value }) => {
  if (operation !== "create") return value;
  const { totalDocs } = await req.payload.count({ collection: "users" });
  return totalDocs === 0 ? ["admin"] : value;
};
