"use client";
import React, { useEffect, useState } from "react";
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
  const ownerVal = useFormFields(([f]) => f?.owner?.value);
  const reviewNotes = useFormFields(
    ([f]) => f?.reviewNotes?.value as string | undefined,
  );
  const changesByVal = useFormFields(([f]) => f?.changesRequestedBy?.value);
  const modified = useFormModified();
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requesterName, setRequesterName] = useState<string | null>(null);

  // Resolve the name of whoever requested changes (the form only holds the id).
  useEffect(() => {
    const uid = rid(changesByVal);
    if (status !== "changesRequested" || !uid) {
      setRequesterName(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/users/${uid}?depth=0`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setRequesterName((json?.name as string) ?? null);
      } catch {
        /* leave name null — the copy degrades gracefully */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [changesByVal, status]);

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

  // Only the post's OWNER submits it for review — a reviewing editor/admin who
  // isn't the owner never sees "Submit for review".
  const isOwner = Boolean(myId && rid(ownerVal) === myId);
  const isRequester = Boolean(myId && rid(changesByVal) === myId);
  const showSubmit = isOwner && (st === "draft" || st === "changesRequested");
  const showApprove = isEditor && st === "inReview" && !recused;
  const showRequest = isEditor && (st === "inReview" || st === "approved");
  const hasActions = showSubmit || showApprove || showRequest;

  const patch = async (data: Record<string, unknown>) => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/posts/${id}?draft=true`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body?.errors?.[0]?.message ?? "That action was not allowed.");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  // Perspective-aware status line — what it says depends on who's looking.
  const meta = ((): { label: string; tone: string } => {
    if (isPublished)
      return { tone: "published", label: "Published — live on the blog" };
    switch (st) {
      case "inReview":
        return {
          tone: "review",
          label: recused
            ? "In review — waiting for another editor to approve"
            : isEditor
              ? "In review — ready for your review"
              : "In review — waiting for an editor",
        };
      case "changesRequested":
        return {
          tone: "changes",
          label: isOwner
            ? "Changes requested — address the notes below, then resubmit"
            : "Changes requested — waiting for the author to resubmit",
        };
      case "approved":
        return {
          tone: "approved",
          label: isEditor
            ? "Approved — ready to publish"
            : "Approved — waiting to be published",
        };
      default:
        return { tone: "draft", label: "Draft — not yet submitted for review" };
    }
  })();

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

      {st === "changesRequested" && (
        <div className="sw-wf__note">
          <span aria-hidden>📝</span>
          <span>
            {isRequester
              ? "You requested changes"
              : requesterName
                ? `Changes requested by ${requesterName}`
                : "Changes requested"}
            {reviewNotes ? `: ${reviewNotes}` : ""}
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
            {errorMsg && (
              <div
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #f87171",
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                {errorMsg}
              </div>
            )}
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
