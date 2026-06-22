import type { CollectionConfig, Where } from "payload";
import { AUTHOR_ROLES } from "../lib/roles";
import { firstUserAdmin } from "../access/firstUserAdmin";
import { isAdmin, isAdminField, userIsAdmin, userIsEditor } from "../access/roles";
import {
  computeDiscoverability,
  stripPrivateUserFields,
} from "../hooks/discoverability";

// One auth-enabled collection = login identity AND public byline. Keeping them
// as a single record is what makes the "an author only ever touches their own
// posts" rule airtight (a post's owner IS a user id; no separate author doc to
// drift out of sync).
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "roles"],
    group: "People",
  },
  access: {
    // Editors/admins see everyone. An author sees ONLY their own profile PLUS
    // anyone who has switched themselves "discoverable" (so they can be picked
    // as a co-author). Everyone else is hidden. The public byline is fetched
    // server-side via the Local API, which bypasses this.
    read: ({ req: { user } }) => {
      if (userIsEditor(user)) return true;
      if (!user) return false;
      const clauses: Where[] = [
        { id: { equals: user.id } },
        { discoverableUntil: { greater_than: new Date().toISOString() } },
      ];
      return { or: clauses };
    },
    create: isAdmin, // only admins invite new users (first user is exempt)
    update: ({ req: { user } }) =>
      userIsAdmin(user) ? true : { id: { equals: user?.id } }, // self or admin
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [computeDiscoverability],
    afterRead: [stripPrivateUserFields],
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
        { label: "Hidden (default)", value: "hidden" },
        { label: "Discoverable for 1 hour", value: "1hour" },
        { label: "Discoverable for 8 hours", value: "8hours" },
        { label: "Always discoverable", value: "always" },
      ],
      admin: {
        description:
          "Let other authors find you (to add you as a co-author) for a limited time. The window restarts each time you save your profile.",
      },
    },
    {
      name: "discoverableUntil",
      type: "date",
      access: { update: () => false }, // system-set from the window above
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "When your discoverability expires (set automatically).",
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
        read: isAdminField,
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
