import path from "path";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor, UploadFeature } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import sharp from "sharp";

import { Users } from "./collections/Users";
import { Posts } from "./collections/Posts";
import { Media } from "./collections/Media";
import { AuditLog } from "./collections/AuditLog";

// Media uploads go to Cloudflare R2 (S3-compatible) only when its env vars are
// present. This keeps the database (Neon) the ONLY thing required to boot the
// admin locally; R2 can be wired up later, before deploy. Without it, uploads
// fall back to local disk (fine for local dev).
const r2Enabled = Boolean(process.env.R2_BUCKET && process.env.R2_ENDPOINT);

export default buildConfig({
  admin: {
    user: "users",
    importMap: { baseDir: path.resolve(process.cwd(), "src") },
    // Use the logged-in user's uploaded Photo for the top-right avatar.
    avatar: { Component: "/components/admin/Avatar#AdminAvatar" },
    // Speechworks branding: logo on the login/nav, mark in the collapsed nav.
    components: {
      graphics: {
        Logo: "/components/admin/Logo#Logo",
        Icon: "/components/admin/Icon#Icon",
      },
      // Login-time "review queue" on the dashboard.
      beforeDashboard: ["/components/admin/Notifications#Notifications"],
    },
    meta: {
      titleSuffix: "— Speechworks Blog",
      icons: [{ rel: "icon", type: "image/x-icon", url: "/favicon.ico" }],
    },
  },
  collections: [Users, Posts, Media, AuditLog],
  // Keep all default editor features, but give in-text images a Small/Medium/Full
  // size choice (stored on the upload node, rendered by components/RichText).
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter((f) => f.key !== "upload"),
      UploadFeature({
        collections: {
          media: {
            fields: [
              {
                name: "size",
                type: "select",
                defaultValue: "full",
                options: [
                  { label: "Small", value: "small" },
                  { label: "Medium", value: "medium" },
                  { label: "Full width", value: "full" },
                ],
              },
            ],
          },
        },
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || "" },
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(process.cwd(), "src/payload-types.ts"),
  },
  plugins: r2Enabled
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.R2_BUCKET as string,
          config: {
            region: "auto", // required for Cloudflare R2
            endpoint: process.env.R2_ENDPOINT as string,
            forcePathStyle: true, // required for Cloudflare R2
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
            },
          },
        }),
      ]
    : [],
});
