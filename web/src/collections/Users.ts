import type { CollectionConfig, Where } from "payload";
import { AUTHOR_ROLES } from "../lib/roles";
import { firstUserAdmin } from "../access/firstUserAdmin";
import { isAdmin, isAdminField, userIsAdmin, userIsEditor } from "../access/roles";
import {
  allowForgotPasswordEmailSend,
  computeDiscoverability,
  stripPrivateUserFields,
} from "../hooks/discoverability";
import { auditUsersChange, auditUsersDelete } from "../hooks/audit";
import { sendWelcomeEmail } from "../hooks/welcomeEmail";
import { resetPasswordEmail } from "../lib/authEmail";

// One auth-enabled collection = login identity AND public byline. Keeping them
// as a single record is what makes the "an author only ever touches their own
// posts" rule airtight (a post's owner IS a user id; no separate author doc to
// drift out of sync).
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    forgotPassword: {
      generateEmailHTML: (args) => {
        const { token = "", user } = args ?? {};
        return resetPasswordEmail(token, user as Record<string, unknown>).html;
      },
      generateEmailSubject: () => "Reset your Speechworks Blog password",
    },
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles"],
    group: "People",
  },
  access: {
    // Editors/admins see everyone. An author sees: their own profile; anyone who's
    // currently "discoverable" (so they can be picked as a co-author); AND all
    // editors/admins (so the names of whoever submitted/reviewed/approved/published
    // their post resolve, instead of showing "Untitled - ID: N"). Other authors stay
    // hidden. The public byline is fetched server-side via the Local API, which
    // bypasses this.
    read: ({ req: { user } }) => {
      if (userIsEditor(user)) return true;
      if (!user) return false;
      const clauses: Where[] = [
        { id: { equals: user.id } },
        { discoverableUntil: { greater_than: new Date().toISOString() } },
        { roles: { in: ["admin", "editor"] } },
      ];
      return { or: clauses };
    },
    create: isAdmin, // only admins invite new users (first user is exempt)
    update: ({ req: { user } }) =>
      userIsAdmin(user) ? true : { id: { equals: user?.id } }, // self or admin
    delete: isAdmin,
  },
  hooks: {
    beforeOperation: [allowForgotPasswordEmailSend],
    beforeChange: [computeDiscoverability],
    afterChange: [auditUsersChange, sendWelcomeEmail],
    afterRead: [stripPrivateUserFields],
    afterDelete: [auditUsersDelete],
  },
  fields: [
    // --- public byline profile ---
    { name: "name", type: "text", required: true },
    {
      name: "credentials",
      type: "text",
      admin: { description: 'Shown after the name, e.g. "MS, CCC-SLP".' },
    },
    {
      name: "contributorType",
      type: "select",
      options: AUTHOR_ROLES.map((r) => ({ label: r.title, value: r.value })),
      admin: {
        description:
          "The public badge readers see (who is speaking). Separate from permissions below.",
      },
    },
    { name: "bio", type: "textarea" },
    { name: "photo", type: "upload", relationTo: "media" },

    // --- discoverability (lets other authors find you to add you as a co-author) ---
    {
      name: "discoverabilityWindow",
      type: "select",
      defaultValue: "hidden",
      options: [
        { label: "Hidden", value: "hidden" },
        { label: "1 hour", value: "1hour" },
        { label: "8 hours", value: "8hours" },
        { label: "Always", value: "always" },
      ],
      // Set by the DiscoverabilityControl below; hidden as a raw input.
      admin: { hidden: true },
    },
    {
      name: "discoverableUntil",
      type: "date",
      access: { update: () => false }, // system-set from the window via the hook
      admin: {
        // Custom UI: live status line + one-click [Hidden / 1h / 8h / Always] buttons.
        components: {
          Field: "/components/admin/DiscoverabilityControl#DiscoverabilityControl",
        },
      },
    },

    // --- permissions (only an admin can change these) ---
    {
      name: "roles",
      type: "select",
      hasMany: true,
      defaultValue: ["author"],
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
        { label: "Author", value: "author" },
        { label: "Reviewer (SLP peer reviewer)", value: "reviewer" },
      ],
      access: {
        // Readable by anyone who can read the user record (collection-level read
        // already limits WHICH users that is). This must stay open: the admin UI
        // reads the logged-in user's OWN roles to decide which workflow buttons to
        // show — if it were admin-only, editors couldn't see their own "editor"
        // role and lost the Approve/Publish buttons. Only an admin can CHANGE roles.
        create: isAdminField,
        update: isAdminField,
      },
      hooks: { beforeChange: [firstUserAdmin] },
      admin: {
        description:
          "What this person is allowed to do. Only an admin can change this.",
      },
    },
  ],
};
