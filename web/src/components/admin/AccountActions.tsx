"use client";
import React, { useState } from "react";
import { useDocumentInfo, useField } from "@payloadcms/ui";

// Sidebar control on the Users edit view: deactivate (lock out completely) or
// reactivate an account. Deactivating logs the person out and blocks all access
// while keeping their data + published bylines frozen and intact.
type Tone = "success" | "warning" | "error";
type Status = { tone: Tone; message: string } | null;

const COLORS: Record<Tone, { bg: string; border: string; fg: string }> = {
  success: { bg: "#ecfdf5", border: "#34d399", fg: "#065f46" },
  warning: { bg: "#fffbeb", border: "#fbbf24", fg: "#92400e" },
  error: { bg: "#fef2f2", border: "#f87171", fg: "#991b1b" },
};

const Box: React.FC<{ tone: Tone; children: React.ReactNode }> = ({ tone, children }) => (
  <div
    style={{
      padding: "10px 12px",
      borderRadius: 8,
      border: `1px solid ${COLORS[tone].border}`,
      background: COLORS[tone].bg,
      color: COLORS[tone].fg,
      fontSize: 13,
      lineHeight: 1.5,
    }}
  >
    {children}
  </div>
);

const DEACTIVATE_CONFIRM =
  "Deactivate this account?\n\nThey'll be logged out immediately and won't be able to sign in or use the system. Their published posts stay exactly as they are. You can reactivate the account at any time.";

export const AccountActions: React.FC = () => {
  const { value: deactivated } = useField<boolean>({ path: "deactivated" });
  const { id } = useDocumentInfo();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  if (!id) return null; // new (unsaved) record

  const run = async (action: "deactivate" | "reactivate") => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/users/${id}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        setStatus({
          tone: "error",
          message: body?.message ?? "Something went wrong. Please try again.",
        });
        return;
      }
      // Reload so the rest of the form reflects the new locked/unlocked state.
      window.location.reload();
    } catch {
      setStatus({ tone: "error", message: "Could not reach the server. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const onDeactivate = () => {
    if (window.confirm(DEACTIVATE_CONFIRM)) void run("deactivate");
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Account access</div>
      {deactivated ? (
        <>
          <Box tone="warning">
            Deactivated — this person is locked out of the system. Their published
            posts are unchanged.
          </Box>
          <button
            type="button"
            onClick={() => void run("reactivate")}
            disabled={busy}
            style={{
              marginTop: 10,
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              border: "1px solid #34d399",
              background: "#ecfdf5",
              color: "#065f46",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Working…" : "Reactivate account"}
          </button>
        </>
      ) : (
        <>
          <Box tone="success">Active — this person can sign in and use the system.</Box>
          <button
            type="button"
            onClick={onDeactivate}
            disabled={busy}
            style={{
              marginTop: 10,
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              border: "1px solid #f87171",
              background: "#fef2f2",
              color: "#991b1b",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "Working…" : "Deactivate account"}
          </button>
        </>
      )}
      {status && (
        <div style={{ marginTop: 10 }}>
          <Box tone={status.tone}>{status.message}</Box>
        </div>
      )}
    </div>
  );
};

export default AccountActions;
