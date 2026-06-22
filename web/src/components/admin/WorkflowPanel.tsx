"use client";
import React, { useState } from "react";
import {
  Button,
  useAuth,
  useDocumentInfo,
  useFormFields,
  useFormModified,
} from "@payloadcms/ui";
import type { User } from "../../payload-types";
import { userIsAdmin, userIsEditor } from "../../access/roles";

// Pull a user id out of a relationship form value (id, {id}, or {value}).
const rid = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === "object") {
    const o = v as { id?: unknown; value?: unknown };
    if (o.id != null) return String(o.id);
    if (o.value != null) return String(o.value);
    return undefined;
  }
  return String(v);
};

const STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Draft — not yet submitted for review", tone: "draft" },
  inReview: { label: "In review — waiting for an editor", tone: "review" },
  changesRequested: {
    label: "Changes requested — address the notes below, then resubmit",
    tone: "changes",
  },
  approved: { label: "Approved — ready for an editor to publish", tone: "approved" },
};

// The review-status panel at the top of a post: a clear, full-width card showing the
// current stage plus the role-aware workflow actions. It lives in the main column (a
// `ui` field) so it never crowds the Save/Publish toolbar and wraps cleanly on
// mobile. The server-side workflowGate hook is the real enforcement — these buttons
// only surface legal actions.
export const WorkflowPanel: React.FC = () => {
  const { user } = useAuth<User>();
  const { id } = useDocumentInfo();
  const status = useFormFields(
    ([f]) => f?.workflowStatus?.value as string | undefined,
  );
  const isPublished =
    useFormFields(([f]) => f?._status?.value as string | undefined) === "published";
  const authorVal = useFormFields(([f]) => f?.author?.value);
  const coAuthorsVal = useFormFields(([f]) => f?.coAuthors?.value);
  const modified = useFormModified();
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!id) return null; // new, unsaved doc — nothing to track yet

  const isEditor = userIsEditor(user);
  const st = (status ?? "draft") as string;

  // Independent review: an editor who is the author/co-author can't approve their
  // own post (admins are exempt). Mirrors the server-side workflowGate.
  const myId = user?.id != null ? String(user.id) : undefined;
  const contributors = new Set<string>();
  const aId = rid(authorVal);
  if (aId) contributors.add(aId);
  if (Array.isArray(coAuthorsVal)) {
    for (const c of coAuthorsVal) {
      const x = rid(c);
      if (x) contributors.add(x);
    }
  }
  const recused =
    isEditor && !userIsAdmin(user) && Boolean(myId && contributors.has(myId));

  const showSubmit = st === "draft" || st === "changesRequested";
  const showApprove = isEditor && st === "inReview" && !recused;
  const showRequest = isEditor && (st === "inReview" || st === "approved");
  const hasActions = showSubmit || showApprove || showRequest;

  const patch = async (data: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${id}?draft=true`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        window.alert(body?.errors?.[0]?.message ?? "That action was not allowed.");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const meta = isPublished
    ? { label: "Published — live on the blog", tone: "published" }
    : (STATUS[st] ?? STATUS.draft);

  return (
    <div className={`sw-wf sw-tone-${meta.tone}`}>
      <span className="sw-wf__label">Review status</span>
      <span className="sw-wf__status">
        <span className="sw-wf__dot" aria-hidden />
        {meta.label}
      </span>

      {st === "inReview" && recused && (
        <div className="sw-wf__note">
          <span aria-hidden>⚠️</span>
          <span>
            You&rsquo;re an author or co-author of this post, so you can&rsquo;t
            approve it. Another editor or an admin must approve it.
          </span>
        </div>
      )}

      {st === "approved" && isEditor && !isPublished && !userIsAdmin(user) && (
        <span className="sw-wf__muted">
          Editing the content will send this post back to review.
        </span>
      )}

      {hasActions &&
        (modified ? (
          <span className="sw-wf__muted">
            Save your changes to use the workflow actions.
          </span>
        ) : (
          <div className="sw-wf__actions">
            {showSubmit && (
              <Button
                size="small"
                buttonStyle="primary"
                disabled={busy}
                onClick={() => patch({ workflowStatus: "inReview" })}
              >
                Submit for review
              </Button>
            )}
            {showApprove && (
              <Button
                size="small"
                buttonStyle="primary"
                disabled={busy}
                onClick={() => patch({ workflowStatus: "approved" })}
              >
                Approve
              </Button>
            )}
            {showRequest && !noteOpen && (
              <Button
                size="small"
                buttonStyle="secondary"
                disabled={busy}
                onClick={() => setNoteOpen(true)}
              >
                Request changes
              </Button>
            )}
            {showRequest && noteOpen && (
              <>
                <input
                  className="sw-wf__input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What needs changing?"
                />
                <Button
                  size="small"
                  buttonStyle="primary"
                  disabled={busy || !note.trim()}
                  onClick={() =>
                    patch({ workflowStatus: "changesRequested", reviewNotes: note })
                  }
                >
                  Send
                </Button>
                <Button
                  size="small"
                  buttonStyle="secondary"
                  disabled={busy}
                  onClick={() => {
                    setNoteOpen(false);
                    setNote("");
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        ))}
    </div>
  );
};

export default WorkflowPanel;
