// Central, reusable permission checks. ONE source of truth for "who is an
// admin / editor / reviewer", used by both collection access and field access —
// real per-user roles enforced on every request, not a soft allow-list.
import type { Access, FieldAccess } from "payload";
import type { User } from "../payload-types";

type MaybeUser = Pick<User, "roles" | "deactivated"> | null | undefined;
type Role = NonNullable<NonNullable<User["roles"]>[number]>;

// An active user = present AND not deactivated. A deactivated account is treated
// as if it has no roles and isn't logged in, so it's denied EVERYWHERE these
// predicates are used (collection + field access). This is the single chokepoint
// that locks a deactivated user out of the whole system.
export const isActive = (user: MaybeUser): boolean =>
  Boolean(user) && user?.deactivated !== true;

const hasRole = (user: MaybeUser, role: Role): boolean =>
  isActive(user) && Boolean(user?.roles?.includes(role));

// Plain predicates (also usable inside hooks, not just access functions).
export const userIsAdmin = (user: MaybeUser): boolean => hasRole(user, "admin");
export const userIsEditor = (user: MaybeUser): boolean =>
  userIsAdmin(user) || hasRole(user, "editor");
export const userIsReviewer = (user: MaybeUser): boolean =>
  userIsAdmin(user) || hasRole(user, "reviewer");

// Collection-access wrappers: ({ req }) => boolean | Where
export const isAdmin: Access = ({ req: { user } }) => userIsAdmin(user);
export const isEditor: Access = ({ req: { user } }) => userIsEditor(user);
export const isLoggedIn: Access = ({ req: { user } }) => isActive(user);

// Field-access wrappers: ({ req }) => boolean (field access is boolean-only)
export const isAdminField: FieldAccess = ({ req: { user } }) => userIsAdmin(user);
export const isEditorField: FieldAccess = ({ req: { user } }) =>
  userIsEditor(user);
