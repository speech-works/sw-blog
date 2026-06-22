import { APIError, type CollectionBeforeChangeHook } from "payload";
import { userIsAdmin, userIsEditor } from "../access/roles";

// The server-side enforcement of the approval workflow. This runs on every save and
// is the REAL gate (the admin buttons are just convenient triggers). It cannot be
// bypassed via the API.
const EDITABLE = ["draft", "changesRequested"];

// Content fields whose change to an already-approved post should force re-review.
const CONTENT_FIELDS = [
  "title",
  "slug",
  "excerpt",
  "author",
  "coAuthors",
  "peerReviewers",
  "coverImage",
  "body",
  "audio",
  "audioUrl",
  "tags",
];

// Pull a user id out of a relationship value (id, {id}, or {value}).
const relId = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === "object") {
    const o = v as { id?: unknown; value?: unknown };
    if (o.id != null) return String(o.id);
    if (o.value != null) return String(o.value);
    return undefined;
  }
  return String(v);
};
const relIds = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(relId).filter((x): x is string => Boolean(x)) : [];

export const workflowGate: CollectionBeforeChangeHook = ({
  data,
  req,
  originalDoc,
  operation,
}) => {
  const user = req.user;
  const isAdmin = userIsAdmin(user);
  const isEditor = userIsEditor(user);
  const d = data as Record<string, unknown>;
  const orig = (originalDoc ?? {}) as Record<string, unknown>;

  // Every new post starts as a fresh draft. This matters for DUPLICATE, which copies
  // all fields from the source — without this, duplicating an approved/published post
  // would create a copy that's already approved/published (skipping review) and carry
  // the original's stale audit stamps. A normal "Create New" is already a draft.
  //
  // We then RETURN immediately: on create the post is, by definition, a brand-new
  // draft, so none of the transition/publish gates below apply. (They must be skipped
  // — Duplicate passes the source's status as the "previous" value, which would
  // otherwise make the non-editor transition gate reject the copy.)
  if (operation === "create") {
    d.workflowStatus = "draft";
    d._status = "draft";
    d.publishedAt = null;
    d.reviewNotes = null;
    d.submittedBy = null;
    d.submittedAt = null;
    d.changesRequestedBy = null;
    d.changesRequestedAt = null;
    d.approvedBy = null;
    d.approvedAt = null;
    d.publishedBy = null;
    return data;
  }

  const prev = (orig.workflowStatus ?? "draft") as string;

  // Re-review on edit: editing the CONTENT of an already-approved post (a real
  // document save — not a publish, and not a workflow-button PATCH which only sends
  // workflowStatus) sends it back to "In review", so the changes get re-checked
  // before going (or staying) live. Admins are exempt. Authors can't reach this
  // (they can't edit an approved post), so in practice this targets editors.
  const isPublishing = d._status === "published";
  const isContentSave = CONTENT_FIELDS.some((f) => f in d);
  if (prev === "approved" && isContentSave && !isPublishing && !isAdmin) {
    d.workflowStatus = "inReview";
    d.approvedBy = null;
    d.approvedAt = null;
  }

  const next = (d.workflowStatus ?? prev) as string;
  const stamp = new Date().toISOString();

  // 1) Publish gate: only an editor, and only once the post is Approved.
  if (d._status === "published") {
    const approved = prev === "approved" || d.workflowStatus === "approved";
    if (!isEditor) throw new APIError("Only an editor can publish.", 403);
    if (!approved) {
      throw new APIError(
        "A post must be Approved by an editor before it can be published.",
        403,
      );
    }
  }

  // 2) Independent review: an editor who is an author/co-author of the post can't
  //    approve their OWN work — another editor or an admin must. Admins are exempt
  //    (the escape hatch for a one-editor team). We union the contributors from both
  //    the incoming data and the saved doc, so you can't remove yourself as a
  //    co-author and approve in the same request.
  if (next === "approved" && prev !== "approved" && !isAdmin) {
    const contributors = new Set<string>();
    for (const src of [orig, d]) {
      const a = relId(src.author);
      if (a) contributors.add(a);
      for (const c of relIds(src.coAuthors)) contributors.add(c);
    }
    if (user?.id != null && contributors.has(String(user.id))) {
      throw new APIError(
        "You're an author or co-author of this post, so you can't approve it. " +
          "Another editor or an admin must approve it.",
        403,
      );
    }
  }

  // 3) "Request changes" must carry a note the author can read.
  if (
    next === "changesRequested" &&
    !(typeof d.reviewNotes === "string" && d.reviewNotes.trim())
  ) {
    throw new APIError(
      "Please add a note explaining what changes are needed.",
      400,
    );
  }

  // 4) Non-editors can only submit their own draft for review. Approving and
  //    publishing are editor-only.
  if (!isEditor && next !== prev) {
    const ok = EDITABLE.includes(prev) && next === "inReview";
    if (!ok) {
      throw new APIError(
        "You can only submit your post for review; an editor approves and publishes.",
        403,
      );
    }
  }

  // 4b) Submit-for-review is owner-only: a reviewing editor/admin who isn't the
  //     owner can't submit someone else's post. Scoped to the EXPLICIT submit
  //     request (draft/changesRequested -> inReview) so it never blocks the
  //     approved -> inReview auto re-review. Admins are exempt.
  const askedSubmit = d.workflowStatus === "inReview" && EDITABLE.includes(prev);
  if (askedSubmit && !isAdmin) {
    const ownerId = relId(orig.owner) ?? relId(d.owner);
    if (user?.id != null && ownerId && String(user.id) !== ownerId) {
      throw new APIError(
        "Only the post's owner can submit it for review.",
        403,
      );
    }
  }

  // 5) Audit trail (system-only fields, set here on each transition).
  if (next !== prev) {
    // Only a DELIBERATE submit (from draft/changesRequested) records the submitter.
    // The approved -> inReview auto re-review must NOT overwrite the original
    // author's submission with the editor who edited.
    if (next === "inReview" && prev !== "approved") {
      d.submittedBy = user?.id;
      d.submittedAt = stamp;
    }
    if (next === "approved") {
      d.approvedBy = user?.id;
      d.approvedAt = stamp;
    }
    if (next === "changesRequested") {
      d.changesRequestedBy = user?.id;
      d.changesRequestedAt = stamp;
    }
  }
  // First publish: record who published it AND stamp the public "published date" to
  // now — unless an editor set a custom (e.g. back-dated) date. This is the real
  // publish moment, not the draft's creation date.
  if (d._status === "published" && orig._status !== "published") {
    d.publishedBy = user?.id;
    if (d.publishedAt == null && orig.publishedAt == null) {
      d.publishedAt = stamp;
    }
  }

  return data;
};
