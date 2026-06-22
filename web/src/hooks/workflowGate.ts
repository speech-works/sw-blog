import { APIError, type CollectionBeforeChangeHook } from "payload";
import { userIsEditor } from "../access/roles";

// The server-side enforcement of the approval workflow. This runs on every
// save and is the REAL gate (the admin buttons are just convenient triggers).
// It cannot be bypassed via the API — the admin buttons are just triggers.
const EDITABLE = ["draft", "changesRequested"];

export const workflowGate: CollectionBeforeChangeHook = ({
  data,
  req,
  originalDoc,
}) => {
  const user = req.user;
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

  // 2) "Request changes" must carry a note the author can read.
  if (
    next === "changesRequested" &&
    !(typeof d.reviewNotes === "string" && d.reviewNotes.trim())
  ) {
    throw new APIError(
      "Please add a note explaining what changes are needed.",
      400,
    );
  }

  // 3) Non-editors can only submit their own draft for review. Approving and
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

  // 4) Audit trail (system-only fields, set here on each transition).
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
