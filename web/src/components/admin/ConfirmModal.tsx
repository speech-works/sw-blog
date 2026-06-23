"use client";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

// Replaces window.confirm() calls — matches Payload's own "Leave without saving"
// modal style (blurred overlay, dark card, themed buttons). Portals to document.body
// so it sits above all Payload chrome regardless of where the trigger is.
export const ConfirmModal: React.FC<Props> = ({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  const confirmBg = tone === "danger" ? "#dc2626" : "#2563eb";

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "var(--theme-elevation-50, #111)",
          border: "1px solid var(--theme-elevation-200, #1e293b)",
          borderRadius: 12,
          padding: "32px 36px",
          maxWidth: 460,
          width: "90vw",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: "0 0 10px",
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1.3,
            color: "var(--theme-text, inherit)",
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: 14,
            lineHeight: 1.65,
            color: "var(--theme-elevation-600, #94a3b8)",
          }}
        >
          {description}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "1px solid var(--theme-elevation-300, #334155)",
              background: "var(--theme-elevation-100, rgba(255,255,255,0.05))",
              color: "var(--theme-text, inherit)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "9px 18px",
              borderRadius: 6,
              border: "none",
              background: confirmBg,
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
};

export default ConfirmModal;
