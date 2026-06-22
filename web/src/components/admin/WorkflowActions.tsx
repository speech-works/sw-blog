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

// The clear, role-aware workflow buttons shown next to Save/Publish. They PATCH
// the post's review stage via the API; the server-side workflowGate hook is the
// real enforcement, so these buttons only ever surface *legal* actions.
export const WorkflowActions: React.FC = () => {
  const { user } = useAuth<User>();
  const { id } = useDocumentInfo();
  const status = useFormFields(
    ([fields]) => fields?.workflowStatus?.value as string | undefined,
  );
  const modified = useFormModified();
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!id) return null; // new, unsaved doc — nothing to act on yet
  const isEditor = userIsEditor(user);

  const showSubmit = status === "draft" || status === "changesRequested";
  const showApprove = isEditor && status === "inReview";
  const showRequest = isEditor && (status === "inReview" || status === "approved");
  if (!showSubmit && !showApprove && !showRequest) return null;

  // Acting on the saved doc — block if the form has unsaved edits to avoid losing them.
  if (modified) {
    return (
      <div style={{ fontSize: 13, opacity: 0.7, alignSelf: "center" }}>
        Save your changes to use workflow actions.
      </div>
    );
  }

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

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
    </div>
  );
};

export default WorkflowActions;
