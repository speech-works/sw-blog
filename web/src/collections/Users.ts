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
import {
  activateOnPasswordSet,
  enforceNonEmptyName,
  guardForgotPasswordActivation,
  inviteHandler,
  lockEmailForNonAdmins,
  resendInviteHandler,
} from "../hooks/invite";
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
    defaultColumns: ["name", "email", "roles", "accountActivated"],
    group: "People",
    components: {
      beforeListTable: ["/components/admin/UserListFilters#UserListFilters"],
    },
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
  endpoints: [
    { path: "/invite", method: "post", handler: inviteHandler },
    { path: "/:id/resend-invite", method: "post", handler: resendInviteHandler },
  ],
  hooks: {
    beforeOperation: [allowForgotPasswordEmailSend, guardForgotPasswordActivation],
    beforeChange: [enforceNonEmptyName, lockEmailForNonAdmins, computeDiscoverability],
    afterChange: [auditUsersChange],
    afterOperation: [activateOnPasswordSet],
    afterRead: [stripPrivateUserFields],
    afterDelete: [auditUsersDelete],
  },
  fields: [
    // Warning shown only on the Create New page (hidden on edit pages).
    {
      name: "createWarning",
      type: "ui",
      admin: {
        components: {
          Field: "/components/admin/CreateUserWarning#CreateUserWarning",
        },
      },
    },

    // Email is the login identity. Declared here (Payload still treats it as the
    // auth email) only to attach field access: a non-admin can't change their own
    // email — a self-service change to a wrong address would lock them out with no
    // recovery. Field access renders it read-only in the UI AND blocks the write;
    // lockEmailForNonAdmins is the server-side defense-in-depth. Admins can edit it.
    {
      name: "email",
      type: "email",
      access: { update: isAdminField },
      admin: {
        description: "The login address. Only an administrator can change this.",
      },
    },

    // --- public byline profile ---
    // Nullable in the schema (so system/partial writes needn't carry it), but the
    // enforceNonEmptyName hook rejects an empty value whenever a name IS written —
    // so it can't be cleared once set, and invites always supply one.
    {
      name: "name",
      type: "text",
      admin: { description: "The public byline name. Can't be left empty." },
    },
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

    // --- invitation / activation status (system-managed) ---
    {
      name: "accountActivated",
      type: "checkbox",
      // "Status" is used as the list-column header; the sidebar already has its
      // own description so the rename only benefits the list view.
      label: "Status",
      defaultValue: false,
      // System-set: flipped to true by the activateOnPasswordSet hook the first
      // time the invited user sets a password. Never editable by hand.
      access: { create: () => false, update: () => false },
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Becomes active once the invited user sets their password.",
        // Custom Cell turns the raw boolean into a three-tier status badge.
        components: {
          Cell: "/components/admin/UserStatusCell#UserStatusCell",
        },
      },
    },
    {
      // Live invitation status + a one-click "Resend invitation" button (shown
      // only while the account is still pending). The component renders its own
      // "Account status" heading so no extra label is needed.
      name: "inviteStatus",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field: "/components/admin/ResendInvite#ResendInvite",
        },
      },
    },

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
