import { createClient } from "@sanity/client";
import { apiVersion, dataset, projectId } from "./env";

// `useCdn: true` serves from Sanity's globally cached API, which is what makes a
// publish appear quickly without rebuilding anything. `projectId` falls back to a
// format-valid placeholder so importing this module never throws before the real
// project is wired up; actual fetches are guarded by `isConfigured`.
export const client = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});
