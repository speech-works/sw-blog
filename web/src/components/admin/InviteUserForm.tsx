"use client";
import React, { useState } from "react";

// Designations map 1:1 to the role values on the Users collection. The invited
// person can never change this themselves (roles is admin-only).
const ROLES = [
  { label: "Author", value: "author" },
  { label: "Editor", value: "editor" },
  { label: "Reviewer (SLP peer reviewer)", value: "reviewer" },
  { label: "Admin", value: "admin" },
];

type Tone = "success" | "warning" | "error";
type Status = { tone: Tone; message: string; link?: { href: string; text: string } } | null;

const COLORS: Record<Tone, { bg: string; border: string; fg: string }> = {
  success: { bg: "#ecfdf5", border: "#34d399", fg: "#065f46" },
  warning: { bg: "#fffbeb", border: "#fbbf24", fg: "#92400e" },
  error: { bg: "#fef2f2", border: "#f87171", fg: "#991b1b" },
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid var(--theme-elevation-200)",
  background: "var(--theme-input-bg, transparent)",
  fontSize: 15,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: 14,
  marginBottom: 6,
};

export const InviteUserForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("author");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/users/invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), role }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body?.ok) {
        // 409 = email belongs to an already-active account; surface a link to that user.
        const conflictLink =
          res.status === 409 && body?.id
            ? { href: `/admin/collections/users/${body.id}`, text: "View their profile" }
            : undefined;
        setStatus({
          tone: "error",
          message: body?.message ?? "Something went wrong. Please try again.",
          link: conflictLink,
        });
        return;
      }

      const sentTo = body.email ?? email.trim();
      const userLink = body.id
        ? { href: `/admin/collections/users/${body.id}`, text: "Open user record" }
        : undefined;
      const wasResent = body.resent === true;

      if (body.emailSent) {
        setStatus({
          tone: "success",
          message: wasResent
            ? `${sentTo} already had a pending invite. A fresh 48-hour link has been sent.`
            : `Invitation sent to ${sentTo}.`,
          link: userLink,
        });
        if (!wasResent) {
          setEmail("");
          setName("");
          setRole("author");
        }
      } else if (body.reason === "not-configured") {
        setStatus({
          tone: "warning",
          message: wasResent
            ? `A fresh link was generated but email isn't set up in this environment, so nothing was delivered. Configure SMTP and try again.`
            : `User created, but email isn't set up in this environment, so no invitation was delivered. Configure SMTP, then use "Resend invitation" on the user.`,
          link: userLink,
        });
      } else {
        setStatus({
          tone: "warning",
          message: wasResent
            ? `A fresh link was generated but the email failed to send. Please try again.`
            : `User created, but the invitation email failed to send. Use "Resend invitation" on the user to try again.`,
          link: userLink,
        });
      }
    } catch {
      setStatus({
        tone: "error",
        message: "Could not reach the server. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle} htmlFor="invite-email">
          Email <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="person@example.com"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle} htmlFor="invite-name">
          Name <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <input
          id="invite-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name of the person being invited"
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle} htmlFor="invite-role">
          Designation <span style={{ color: "#dc2626" }}>*</span>
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={inputStyle}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn btn--style-primary"
        style={{
          padding: "11px 20px",
          borderRadius: 6,
          border: "none",
          background: "#111827",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Sending…" : "Send invitation"}
      </button>

      {status && (
        <div
          role="status"
          style={{
            marginTop: 22,
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${COLORS[status.tone].border}`,
            background: COLORS[status.tone].bg,
            color: COLORS[status.tone].fg,
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          <div>{status.message}</div>
          {status.link && (
            <a
              href={status.link.href}
              style={{ color: COLORS[status.tone].fg, fontWeight: 600, textDecoration: "underline" }}
            >
              {status.link.text}
            </a>
          )}
        </div>
      )}
    </form>
  );
};

export default InviteUserForm;
