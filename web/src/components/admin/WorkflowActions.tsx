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
import { userIsEditor } from "../../access/roles";

// A clear status chip (so authors can ALWAYS see where their post stands — the
// built-in "Status: Draft" only means "not yet published") plus the role-aware
// workflow buttons. The buttons PATCH the review stage via the API; the server-side
// workflowGate hook is the real enforcement, so only legal actions ever surface.
const STATUS: Record<string, { text: string; color: string }> = {
  draft: { text: "Draft — not yet submitted", color: "#9ca3af" },
  inReview: { text: "In review — waiting for an editor", color: "#f59e0b" },
  changesRequested: {
    text: "Changes requested — address the notes, then resubmit",
    color: "#ef4444",
  },
  approved: { text: "Approved — ready for an editor to publish", color: "#10b981" },
};

export const WorkflowActions: React.FC = () => {
  const { user } = useAuth<User>();
  const { id } = useDocumentInfo();
  const status = useFormFields(
    ([fields]) => fields?.workflowStatus?.value as string | undefined,
  );
  const isPublished =
    useFormFields(([fields]) => fields?._status?.value as string | undefined) ===
    "published";
  const modified = useFormModified();
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!id) return null; // new, unsaved doc — nothing to track yet

  const isEditor = userIsEditor(user);
  const st = (status ?? "draft") as string;
  const showSubmit = st === "draft" || st === "changesRequested";
  const showApprove = isEditor && st === "inReview";
  const showRequest = isEditor && (st === "inReview" || st === "approved");

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

  const chip = isPublished
    ? { text: "Published — live", color: "#10b981" }
    : STATUS[st];

  return (
    <div
      style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}
    >
      {chip && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: chip.color,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: chip.color,
            }}
          />
          {chip.text}
        </span>
      )}

      {modified ? (
        <span style={{ fontSize: 13, opacity: 0.7 }}>
          Save your changes to use workflow actions.
        </span>
      ) : (
        <>
          {showSubmit && (
            <Button
              size="small"
              buttonStyle="secondary"
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
            <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs changing?"
                style={{ padding: "6px 8px", minWidth: 200 }}
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
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default WorkflowActions;
