import type { CollectionConfig } from "payload";
import { isLoggedIn } from "../access/roles";
import { protectMediaInUse } from "../hooks/protectMediaInUse";

// One uploads collection for BOTH images and voice clips. Files live on
// Cloudflare R2 in production (configured in payload.config.ts when R2 env is
// present); locally they fall back to disk. Payload auto-generates the resized
// image variants below and records width/height for each, which the frontend
// uses to size images and avoid layout shift.
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true, // blog media is public
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  admin: { group: "Content" },
  // Block deleting a file that's still used by a post (cover/audio/in-text) or a
  // user's avatar — applies to everyone, admins included.
  hooks: { beforeDelete: [protectMediaInUse] },
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
      admin: { description: "Describe the image for screen readers and SEO." },
    },
  ],
};
