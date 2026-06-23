"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDocumentInfo } from "@payloadcms/ui";

// Shown only on the Users → Create New page (id is undefined when creating). It
// steers admins to the email-invite flow: the native create form is DISABLED by
// default (dimmed + non-interactive, Save blocked) and can only be re-enabled via
// an explicit confirm — because creating a user here bypasses the invitation email
// (they can't set their own password and the account is marked active immediately).
//
// The banner portals itself to the top of the edit column, and the lock is applied
// with a scoped stylesheet keyed off a body attribute. If Payload's markup ever
// changes, the worst case is the lock no-ops and the warning still shows — this is
// a UX guardrail, not a security control (the invite endpoints enforce the real rules).

const LOCK_STYLE_ID = "sw-create-user-lock-style";
const LOCK_CSS = `
body[data-sw-create-locked="true"] .document-fields__edit > *:not(.sw-create-warning-host),
body[data-sw-create-locked="true"] .document-fields__sidebar > *:not(.sw-create-warning-host) {
  opacity: .4;
  pointer-events: none;
  user-select: none;
}
body[data-sw-create-locked="true"] .doc-controls__controls,
body[data-sw-create-locked="true"] .form-submit,
body[data-sw-create-locked="true"] button[type="submit"] {
  opacity: .45 !important;
  pointer-events: none !important;
}
`;

const CONFIRM_MESSAGE =
  "Creating a user here bypasses the secure invitation flow — the person can't set their own password, and the account is marked active immediately. This is not recommended.\n\nEnable this form anyway?";

const Banner: React.FC<{ enabled: boolean; onEnable: () => void; onLock: () => void }> = ({
  enabled,
  onEnable,
  onLock,
}) => (
  <div
    style={{
      padding: "16px 20px",
      borderRadius: 10,
      background: "#fffbeb",
      border: "2px solid #f59e0b",
      color: "#78350f",
      marginBottom: 24,
      lineHeight: 1.6,
      fontSize: 14,
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
      ⚠ Use the invite flow — not this form — to add contributors
    </div>
    <p style={{ margin: "0 0 12px" }}>
      This page creates a user with a password <em>you</em> set. The invited
      person never goes through the invitation email, can&rsquo;t set their own
      password, and the account is marked active immediately. The form below is
      disabled for that reason.
    </p>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <a
        href="/admin/invite-user"
        style={{
          display: "inline-block",
          padding: "8px 16px",
          background: "#d97706",
          color: "#fff",
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
        }}
      >
        Go to Invite a user →
      </a>
      {enabled ? (
        <>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>
            Form enabled — proceed with caution.
          </span>
          <button
            type="button"
            onClick={onLock}
            style={{
              padding: "7px 14px",
              background: "transparent",
              color: "#78350f",
              border: "1px solid #d97706",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Disable again
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onEnable}
          style={{
            padding: "8px 14px",
            background: "transparent",
            color: "#78350f",
            border: "1px solid #d97706",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Enable this form anyway
        </button>
      )}
    </div>
  </div>
);

export const CreateUserWarning: React.FC = () => {
  const { id } = useDocumentInfo();
  const isCreate = !id;
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);

  // Inject the lock stylesheet once.
  useEffect(() => {
    if (!isCreate || document.getElementById(LOCK_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = LOCK_STYLE_ID;
    style.textContent = LOCK_CSS;
    document.head.appendChild(style);
  }, [isCreate]);

  // Mount a host at the top of the edit column and portal the banner into it.
  useEffect(() => {
    if (!isCreate) return;
    const main =
      document.querySelector(".document-fields__edit") ??
      document.querySelector(".document-fields");
    if (!main) return;
    const el = document.createElement("div");
    el.className = "sw-create-warning-host";
    main.prepend(el);
    setHost(el);
    return () => {
      el.remove();
      setHost(null);
    };
  }, [isCreate]);

  // Apply / lift the lock; always clean up on unmount so other pages aren't locked.
  useEffect(() => {
    if (!isCreate) return;
    document.body.setAttribute("data-sw-create-locked", enabled ? "false" : "true");
    return () => document.body.removeAttribute("data-sw-create-locked");
  }, [isCreate, enabled]);

  if (!isCreate) return null;

  const handleEnable = () => {
    if (window.confirm(CONFIRM_MESSAGE)) setEnabled(true);
  };

  const banner = (
    <Banner enabled={enabled} onEnable={handleEnable} onLock={() => setEnabled(false)} />
  );

  // Prefer the top-of-column host; fall back to inline if the markup changed.
  return host ? createPortal(banner, host) : banner;
};

export default CreateUserWarning;
