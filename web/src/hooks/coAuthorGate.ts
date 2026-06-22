import { APIError, type CollectionBeforeValidateHook } from "payload";
import { userIsEditor } from "../access/roles";

const toIds = (v: unknown): number[] =>
  Array.isArray(v)
    ? v
        .map((x) => (x && typeof x === "object" ? (x as { id?: unknown }).id : x))
        .filter((x): x is number => typeof x === "number")
    : [];

// Hard-enforce "you can only ADD a co-author / peer-reviewer who is currently
// discoverable." Editors may add anyone; you may always include yourself; and
// people already on the post are exempt, so a co-author going hidden later never
// blocks further edits. This closes the raw-API back door that the picker UI
// alone can't.
export const enforceCoAuthorDiscoverability: CollectionBeforeValidateHook =
  async ({ data, req, originalDoc }) => {
    if (!data || userIsEditor(req.user)) return data;
    const d = data as Record<string, unknown>;
    const orig = (originalDoc ?? {}) as Record<string, unknown>;

    const existing = new Set([
      ...toIds(orig.coAuthors),
      ...toIds(orig.peerReviewers),
    ]);
    const selfId = req.user?.id;
    const candidates = [...toIds(d.coAuthors), ...toIds(d.peerReviewers)].filter(
      (id) => !existing.has(id) && id !== selfId,
    );

    for (const id of candidates) {
      const target = await req.payload
        .findByID({ collection: "users", id, overrideAccess: true, depth: 0 })
        .catch(() => null);
      const until = (target as { discoverableUntil?: string } | null)
        ?.discoverableUntil;
      const isDiscoverable = until ? new Date(until).getTime() > Date.now() : false;
      if (!isDiscoverable) {
        throw new APIError(
          "You can only add a co-author or reviewer who is currently discoverable.",
          403,
        );
      }
    }
    return data;
  };
