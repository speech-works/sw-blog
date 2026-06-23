import { APIError } from "payload";
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeLoginHook,
} from "payload";
import { userIsAdmin } from "../access/roles";

// Account deactivation = a reversible, full lockout. The hooks here enforce it at
// the edges that the central access predicates (access/roles.ts → isActive) don't
// cover: the login flow, edits to a deactivated record, and hard-deletion.

// Block a deactivated account from logging in. (access/roles.ts already denies a
// deactivated session everywhere else; this stops a fresh login.)
export const blockDeactivatedLogin: CollectionBeforeLoginHook = ({ user }) => {
  if ((user as { deactivated?: unknown })?.deactivated === true) {
    throw new APIError(
      "This account has been deactivated. Please contact an administrator.",
      403,
    );
  }
};

// Freeze a deactivated record: while deactivated, the ONLY permitted write is
// reactivation (deactivated → false). This keeps the public byline frozen exactly
// as published and stops anyone editing a locked account. The deactivate endpoint
// itself transitions from active (originalDoc.deactivated !== true), so it isn't
// blocked.
export const freezeDeactivatedUser: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
}) => {
  if (operation !== "update") return data;
  const orig = (originalDoc ?? {}) as { deactivated?: unknown };
  if (orig.deactivated !== true) return data; // not currently deactivated

  const d = data as Record<string, unknown>;
  if (d.deactivated === false) return data; // reactivation is allowed

  throw new APIError(
    "This account is deactivated. Reactivate it before making any changes.",
    403,
  );
};

// Never hard-delete a user still referenced by a post (as author, owner, co-author,
// or peer reviewer) — that would orphan bylines / scrub credits on published work.
// Deactivate instead. Content-less accounts (e.g. a mistaken invite) stay deletable.
export const guardDeleteReferencedUser: CollectionBeforeDeleteHook = async ({
  req,
  id,
}) => {
  const { totalDocs } = await req.payload.count({
    collection: "posts",
    where: {
      or: [
        { author: { equals: id } },
        { owner: { equals: id } },
        { coAuthors: { in: [id] } },
        { peerReviewers: { in: [id] } },
      ],
    },
    overrideAccess: true,
  });
  if (totalDocs > 0) {
    throw new APIError(
      "This person has authored or contributed to posts, so deleting their account would break that published work. Deactivate the account instead — their posts stay exactly as they are.",
      400,
    );
  }
};

// Friendly, explicit message for any non-admin delete attempt. (Collection delete
// access is already admin-only, so this is defense-in-depth + a clear message.)
export const guardSelfAccountDeletion: CollectionBeforeDeleteHook = ({ req }) => {
  if (!userIsAdmin(req.user)) {
    throw new APIError(
      "Only an administrator can remove an account. Please contact an admin if you need yours closed.",
      403,
    );
  }
};
