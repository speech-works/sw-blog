import { APIError, type CollectionBeforeChangeHook } from "payload";
import { userIsAdmin, userIsEditor } from "../access/roles";

// The server-side enforcement of the approval workflow. This runs on every save and
// is the REAL gate (the admin buttons are just convenient triggers). It cannot be
// bypassed via the API.
const EDITABLE = ["draft", "changesRequested"];

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
}) => {
  const user = req.user;
  const isAdmin = userIsAdmin(user);
  const isEditor = userIsEditor(user);
  const d = data as Record<string, unknown>;
  const orig = (originalDoc ?? {}) as Record<string, unknown>;

  const prev = (orig.workflowStatus ?? "draft") as string;
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

  // 5) Audit trail (system-only fields, set here on each transition).
  if (next !== prev) {
    if (next === "inReview") {
      d.submittedBy = user?.id;
      d.submittedAt = stamp;
    }
    if (next === "approved") {
      d.approvedBy = user?.id;
      d.approvedAt = stamp;
    }
  }
  // First publish: record who published it (the date lives in the editorial
  // `publishedAt`, which already defaults to "now" on create).
  if (d._status === "published" && orig._status !== "published") {
    d.publishedBy = user?.id;
  }

  return data;
};
