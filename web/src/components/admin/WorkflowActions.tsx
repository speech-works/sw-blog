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
  const authorVal = useFormFields(([fields]) => fields?.author?.value);
  const coAuthorsVal = useFormFields(([fields]) => fields?.coAuthors?.value);
  const modified = useFormModified();
  const [busy, setBusy] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!id) return null; // new, unsaved doc — nothing to track yet

  const isEditor = userIsEditor(user);
  const st = (status ?? "draft") as string;

  // Independent review: an editor who is an author/co-author can't approve their own
  // post (admins are exempt). The server enforces this too; here we hide Approve and
  // explain why.
  const myId = user?.id != null ? String(user.id) : undefined;
  const contributorIds = new Set<string>();
  const aId = rid(authorVal);
  if (aId) contributorIds.add(aId);
  if (Array.isArray(coAuthorsVal)) {
    for (const c of coAuthorsVal) {
      const x = rid(c);
      if (x) contributorIds.add(x);
    }
  }
  const recused =
    isEditor && !userIsAdmin(user) && Boolean(myId && contributorIds.has(myId));

  const showSubmit = st === "draft" || st === "changesRequested";
  const showApprove = isEditor && st === "inReview" && !recused;
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
          {st === "inReview" && recused && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f59e0b" }}>
              ⚠️ You&rsquo;re an author/co-author — another editor or an admin must
              approve this.
            </span>
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
