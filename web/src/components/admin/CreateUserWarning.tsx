"use client";
import React from "react";
import { useDocumentInfo } from "@payloadcms/ui";

// Shown only on the Users → Create New page (id is undefined when creating).
// On any existing user's edit page, id is set and this renders nothing.
// The goal is to steer admins away from manually creating users with a password
// and toward the email-invite flow instead.
export const CreateUserWarning: React.FC = () => {
  const { id } = useDocumentInfo();
  if (id) return null;

  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 10,
        background: "#fffbeb",
        border: "2px solid #f59e0b",
        color: "#78350f",
        marginBottom: 28,
        lineHeight: 1.6,
        fontSize: 14,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
        ⚠ Use the invite flow — not this form — to add contributors
      </div>
      <p style={{ margin: "0 0 10px" }}>
        This page creates a user with a password <em>you</em> set. The invited
        person never goes through the invitation email, can&rsquo;t set their
        own password, and the account won&rsquo;t be marked active — which means
        they&rsquo;ll be blocked from the forgot-password flow.
      </p>
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
    </div>
  );
};

export default CreateUserWarning;
