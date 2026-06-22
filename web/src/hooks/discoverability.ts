import type {
  CollectionAfterReadHook,
  CollectionBeforeChangeHook,
} from "payload";
import { userIsEditor } from "../access/roles";

// Time-boxed author discoverability. An author picks a window
// (hidden / 1h / 8h / always); this turns that choice into a concrete expiry
// timestamp (`discoverableUntil`). The co-author picker + Users read access only
// surface users whose window hasn't expired, so people are hidden by default and
// only findable while they've opted in.
const HOUR_MS = 60 * 60 * 1000;
// Sentinel far-future date = "always discoverable".
export const ALWAYS_DISCOVERABLE = "9999-12-31T00:00:00.000Z";

export const computeDiscoverability: CollectionBeforeChangeHook = ({ data }) => {
  const d = data as Record<string, unknown>;
  // Only recompute the expiry when the window is actually part of this update.
  // Otherwise a partial update that omits discoverabilityWindow (e.g. a programmatic
  // "set roles" call) would wrongly wipe discoverableUntil and hide the user.
  if (!("discoverabilityWindow" in d)) return data;
  const window = d.discoverabilityWindow as string | undefined;
  if (window === "1hour") {
    d.discoverableUntil = new Date(Date.now() + HOUR_MS).toISOString();
  } else if (window === "8hours") {
    d.discoverableUntil = new Date(Date.now() + 8 * HOUR_MS).toISOString();
  } else if (window === "always") {
    d.discoverableUntil = ALWAYS_DISCOVERABLE;
  } else {
    d.discoverableUntil = null; // hidden (default)
  }
  return data;
};

// Keep a user's email private from everyone except themselves and editors/admins
// — even while they're discoverable, others should only see name/badge/photo.
export const stripPrivateUserFields: CollectionAfterReadHook = ({ doc, req }) => {
  if (doc && !userIsEditor(req.user) && req.user?.id !== doc.id) {
    return { ...doc, email: undefined } as typeof doc;
  }
  return doc;
};
