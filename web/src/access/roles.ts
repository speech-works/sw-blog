// Central, reusable permission checks. ONE source of truth for "who is an
// admin / editor / reviewer", used by both collection access and field access.
// (Replaces Sanity's email allow-list and the duplicated owner/permission logic.)
import type { Access, FieldAccess } from "payload";
import type { User } from "../payload-types";

type MaybeUser = Pick<User, "roles"> | null | undefined;
type Role = NonNullable<NonNullable<User["roles"]>[number]>;

const hasRole = (user: MaybeUser, role: Role): boolean =>
  Boolean(user?.roles?.includes(role));

// Plain predicates (also usable inside hooks, not just access functions).
export const userIsAdmin = (user: MaybeUser): boolean => hasRole(user, "admin");
export const userIsEditor = (user: MaybeUser): boolean =>
  userIsAdmin(user) || hasRole(user, "editor");
export const userIsReviewer = (user: MaybeUser): boolean =>
  userIsAdmin(user) || hasRole(user, "reviewer");

// Collection-access wrappers: ({ req }) => boolean | Where
export const isAdmin: Access = ({ req: { user } }) => userIsAdmin(user);
export const isEditor: Access = ({ req: { user } }) => userIsEditor(user);
export const isLoggedIn: Access = ({ req: { user } }) => Boolean(user);

// Field-access wrappers: ({ req }) => boolean (field access is boolean-only)
export const isAdminField: FieldAccess = ({ req: { user } }) => userIsAdmin(user);
export const isEditorField: FieldAccess = ({ req: { user } }) =>
  userIsEditor(user);
