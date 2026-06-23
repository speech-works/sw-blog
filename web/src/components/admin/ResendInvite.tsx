"use client";
import React, { useState } from "react";
import { useDocumentInfo, useField } from "@payloadcms/ui";

// Sidebar control on the Users edit view. While an invited account is still
// pending it shows an amber "pending" line + a Resend button (mints a fresh 48h
// link, invalidating the old one). Once active it just confirms the state.
type Tone = "success" | "warning" | "error" | "neutral";
type Status = { tone: Tone; message: string } | null;

const COLORS: Record<Tone, { bg: string; border: string; fg: string }> = {
  success: { bg: "#ecfdf5", border: "#34d399", fg: "#065f46" },
  warning: { bg: "#fffbeb", border: "#fbbf24", fg: "#92400e" },
  error: { bg: "#fef2f2", border: "#f87171", fg: "#991b1b" },
  neutral: { bg: "transparent", border: "var(--theme-elevation-200)", fg: "inherit" },
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

export const ResendInvite: React.FC = () => {
  const { value: activated } = useField<boolean>({ path: "accountActivated" });
  const { id } = useDocumentInfo();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  if (!id) return null; // new (unsaved) record — nothing to resend yet

  if (activated) {
    return (
      <div className="sw-side">
        <div className="sw-side__title">Account status</div>
        <Box tone="success">Active — this person has set up their account.</Box>
      </div>
    );
  }

  const resend = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/users/${id}/resend-invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        setStatus({ tone: "error", message: body?.message ?? "Could not resend the invitation." });
        return;
      }
      if (body.emailSent) {
        setStatus({ tone: "success", message: `Invitation re-sent to ${body.email ?? "the user"}.` });
      } else if (body.reason === "not-configured") {
        setStatus({
          tone: "warning",
          message: "A fresh link was generated, but email isn't set up in this environment, so nothing was delivered.",
        });
      } else {
        setStatus({ tone: "warning", message: "The invitation email failed to send. Please try again." });
      }
    } catch {
      setStatus({ tone: "error", message: "Could not reach the server. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sw-side">
      <div className="sw-side__title">Account status</div>
      <Box tone="warning">
        Invitation pending — this person hasn&rsquo;t set a password yet.
      </Box>
      <button
        type="button"
        onClick={resend}
        disabled={busy}
        style={{
          marginTop: 10,
          padding: "8px 14px",
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: busy ? "default" : "pointer",
          border: "1px solid var(--theme-elevation-300, #334155)",
          background: "var(--theme-elevation-100, rgba(255,255,255,0.04))",
          color: "var(--theme-text, inherit)",
          opacity: busy ? 0.6 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {busy ? "Sending…" : "Resend invitation"}
      </button>
      {status && (
        <div style={{ marginTop: 10 }}>
          <Box tone={status.tone}>{status.message}</Box>
        </div>
      )}
    </div>
  );
};

export default ResendInvite;
