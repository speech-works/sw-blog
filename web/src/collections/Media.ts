import type { CollectionConfig } from "payload";
import { isLoggedIn, userIsAdmin, userIsEditor } from "../access/roles";
import { protectMediaInUse } from "../hooks/protectMediaInUse";
import { stampOwner } from "../hooks/stampOwner";
import { auditMediaDelete } from "../hooks/audit";

// One uploads collection for BOTH images and voice clips. Files live on
// Cloudflare R2 in production (configured in payload.config.ts when R2 env is
// present); locally they fall back to disk. Payload auto-generates the resized
// image variants below and records width/height for each, which the frontend
// uses to size images and avoid layout shift.
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    // Anonymous reads must stay open — the public blog serves these images, and
    // those requests have no user. Editors/admins manage the whole library (and
    // need to browse it to attach images to posts). A plain author sees only the
    // files they uploaded.
    read: ({ req: { user } }) => {
      if (!user) return true;
      if (userIsEditor(user)) return true;
      return { owner: { equals: user.id } };
    },
    create: isLoggedIn,
    // Replace/delete: an admin can touch any file; everyone else only their own.
    // (Deletion is ALSO blocked while a file is in use — see protectMediaInUse.)
    update: ({ req: { user } }) =>
      userIsAdmin(user) ? true : { owner: { equals: user?.id } },
    delete: ({ req: { user } }) =>
      userIsAdmin(user) ? true : { owner: { equals: user?.id } },
  },
  admin: { group: "Content", defaultColumns: ["filename", "alt", "owner"] },
  // stampOwner records the uploader on create. protectMediaInUse blocks deleting a
  // file still used by a post (cover/audio/in-text) or a user's avatar — applies to
  // everyone, admins included; you must remove it from / delete those first.
  hooks: {
    beforeChange: [stampOwner],
    beforeDelete: [protectMediaInUse],
    afterDelete: [auditMediaDelete],
  },
  upload: {
    mimeTypes: ["image/*", "audio/*"],
    focalPoint: true,
    imageSizes: [
      { name: "card", width: 800, height: 480, position: "centre" }, // PostCard 5:3
      { name: "cover", width: 1200 }, // hero
      { name: "og", width: 1200, height: 630, position: "centre" }, // social share
      { name: "small", width: 800 }, // in-text small
      { name: "medium", width: 1100 }, // in-text medium
      { name: "full", width: 1400 }, // in-text full
      { name: "avatar", width: 160, height: 160, position: "centre" }, // author photo
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      admin: {
        description: "Describe the image for screen readers and SEO.",
        components: {
          Cell: "/components/admin/AltCell#AltCell",
        },
      },
    },
    // System-only: who uploaded this file. Set by stampOwner; never editable by
    // hand. Drives the per-user access scoping above. Pre-existing files have no
    // owner (null) and are managed by admins only.
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      access: { update: () => false },
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Who uploaded this file.",
      },
    },
  ],
};
