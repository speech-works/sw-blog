import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, studioUrl } from "./env";

// One client for the whole app. `next-sanity`'s createClient adds stega support so
// that, in Draft Mode, fetched strings carry invisible source markers the
// visual-editing overlays use to map elements back to their Studio fields.
// `projectId` falls back to a format-valid placeholder so importing this never
// throws before the project is wired up; fetches are guarded by `isConfigured`.
export const client = createClient({
  projectId: projectId || "placeholder",
  dataset,
  apiVersion,
  useCdn: true,
  stega: { studioUrl },
});
