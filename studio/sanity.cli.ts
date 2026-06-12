import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || "production",
  },
  // Pin the local dev server to 3333 so it always matches the CORS origin you add.
  // If 3333 is taken it will error clearly rather than silently using another port.
  server: {
    port: 3333,
  },
  // Lets `npx sanity deploy` host the Studio free at <name>.sanity.studio.
  studioHost: process.env.SANITY_STUDIO_HOST,
});
