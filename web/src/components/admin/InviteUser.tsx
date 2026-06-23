import React from "react";
import type { AdminViewServerProps } from "payload";
import { userIsAdmin } from "../../access/roles";
import { InviteUserForm } from "./InviteUserForm";

// Custom admin view (registered at /admin/invite-user). Server component so
// Payload's non-serializable view props stay on the server; the interactive form
// is a client child. Custom views aren't access-gated by Payload, so we check the
// admin role ourselves (the /api/users/invite endpoint enforces it too).
export const InviteUser: React.FC<AdminViewServerProps> = ({ initPageResult }) => {
  const user = initPageResult?.req?.user;

  if (!userIsAdmin(user)) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 24 }}>Not available</h1>
        <p style={{ opacity: 0.75, lineHeight: 1.6 }}>
          Only administrators can invite users.{" "}
          <a href="/admin">Back to dashboard</a>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
      <a href="/admin" style={{ fontSize: 13, opacity: 0.7 }}>
        ← Back to dashboard
      </a>
      <h1 style={{ margin: "16px 0 6px", fontSize: 28 }}>Invite a user</h1>
      <p style={{ margin: "0 0 28px", opacity: 0.75, lineHeight: 1.6 }}>
        We&rsquo;ll email an invitation with a secure link (valid 48 hours). The
        person sets their own password and completes their profile — you
        don&rsquo;t set a password for them.
      </p>
      <InviteUserForm />
    </div>
  );
};

export default InviteUser;
