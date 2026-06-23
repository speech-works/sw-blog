"use client";
import React from "react";
import { useAuth, useDocumentInfo } from "@payloadcms/ui";
import type { User } from "../../payload-types";

// Renders below the Payload auth block on existing-user edit pages, giving
// admins context for the Change Password and Force Unlock buttons. Hidden on
// the Create New page and hidden entirely for non-admins (they only see
// Change Password, which is self-explanatory, and never see Force Unlock —
// that's gated by the collection's unlock: isAdmin access rule).
export const AuthControlsGuide: React.FC = () => {
  const { id } = useDocumentInfo();
  const { user } = useAuth<User>();
  const isAdmin = user?.roles?.includes("admin");
  if (!id || !isAdmin) return null;

  return (
    <div
      style={{
        marginBottom: "1.25rem",
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid var(--theme-elevation-200, #1e293b)",
        background: "var(--theme-elevation-50, rgba(255,255,255,0.03))",
        fontSize: 12,
        lineHeight: 1.6,
        color: "var(--theme-elevation-500, #64748b)",
      }}
    >
      <strong style={{ display: "block", marginBottom: 6, color: "var(--theme-elevation-600, #94a3b8)", fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}>
        Auth controls guide
      </strong>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div>
          <strong style={{ color: "var(--theme-text, inherit)" }}>Change Password</strong>
          {" — "}
          Lets an admin set a new password for this person directly (they can also use the forgot-password flow themselves).
        </div>
        <div>
          <strong style={{ color: "var(--theme-text, inherit)" }}>Force Unlock</strong>
          {" — "}
          Only needed if this person is temporarily locked out from too many failed sign-in attempts. Locks clear automatically after 10 minutes; use this to unblock them immediately.
        </div>
      </div>
    </div>
  );
};

export default AuthControlsGuide;
