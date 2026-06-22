import config from "@payload-config";
import { getPayload, type Payload } from "payload";

// Cached Payload instance for server-side reads via the Local API (in-process —
// no HTTP hop, the efficient path for SSR/SSG).
let cached: Promise<Payload> | null = null;

export const getPayloadClient = (): Promise<Payload> => {
  if (!cached) cached = getPayload({ config });
  return cached;
};

// Lets pages render an empty-but-valid blog when the database isn't wired yet
// (e.g. a CI build with no DATABASE_URI) instead of hard-failing the build.
export const dbConfigured = (): boolean => Boolean(process.env.DATABASE_URI);
