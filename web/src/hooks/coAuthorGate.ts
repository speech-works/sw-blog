import { APIError, type CollectionBeforeValidateHook } from "payload";
import { userIsEditor } from "../access/roles";

const toIds = (v: unknown): number[] =>
  Array.isArray(v)
    ? v
        .map((x) => (x && typeof x === "object" ? (x as { id?: unknown }).id : x))
        .filter((x): x is number => typeof x === "number")
    : [];

// Single relationship value (id, {id}, {value}) -> string id.
const oneId = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === "object") {
    const o = v as { id?: unknown; value?: unknown };
    if (o.id != null) return String(o.id);
    if (o.value != null) return String(o.value);
    return undefined;
  }
  return String(v);
};

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

// "Peer reviewed by an SLP" is a public trust signal, so it must be real — the
// UI's SLP-only picker is not enough (the API could be called directly). For
// EVERYONE (authors and editors): every peer reviewer must be a speech-language
// pathologist, and the post's own author/owner can never peer-review their own
// work. Only checks reviewers ADDED in this write, so an existing reviewer who
// later changes type never blocks unrelated edits.
export const enforcePeerReviewerRules: CollectionBeforeValidateHook = async ({
  data,
  req,
  originalDoc,
}) => {
  if (!data) return data;
  const d = data as Record<string, unknown>;
  if (!("peerReviewers" in d)) return data;

  const orig = (originalDoc ?? {}) as Record<string, unknown>;
  const existing = new Set(toIds(orig.peerReviewers));
  const added = toIds(d.peerReviewers).filter((id) => !existing.has(id));
  if (added.length === 0) return data;

  const authorId = oneId(d.author) ?? oneId(orig.author);
  const ownerId = oneId(orig.owner) ?? oneId(d.owner);

  for (const id of added) {
    if (String(id) === authorId || String(id) === ownerId) {
      throw new APIError(
        "An author can't be listed as a peer reviewer of their own post — peer review has to come from someone else.",
        400,
      );
    }
    const target = await req.payload
      .findByID({ collection: "users", id, overrideAccess: true, depth: 0 })
      .catch(() => null);
    if ((target as { contributorType?: unknown } | null)?.contributorType !== "slp") {
      throw new APIError(
        "Peer reviewers must be speech-language pathologists (SLPs). Please choose an SLP, or leave this empty.",
        400,
      );
    }
  }
  return data;
};

// The public byline must be truthful: a non-editor can only publish under their
// OWN name. On create we stamp the author to the creator; on update we reject any
// attempt to reassign it to someone else. Editors may assign authorship freely
// (e.g. crediting a guest contributor).
export const enforceAuthorIsSelf: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data || userIsEditor(req.user)) return data;
  const selfId = req.user?.id;
  if (selfId == null) return data;
  const d = data as Record<string, unknown>;

  if (operation === "create") {
    d.author = selfId; // authors write under their own name
    return data;
  }

  if ("author" in d) {
    const next = oneId(d.author);
    const orig = oneId((originalDoc as { author?: unknown } | undefined)?.author);
    if (next && next !== String(selfId) && next !== orig) {
      throw new APIError(
        "You can only publish posts under your own name. Ask an editor if authorship needs to change.",
        403,
      );
    }
  }
  return data;
};
