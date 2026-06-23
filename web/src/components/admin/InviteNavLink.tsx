"use client";
import React from "react";
import { useAuth } from "@payloadcms/ui";
import type { User } from "../../payload-types";
import { userIsAdmin } from "../../access/roles";

// Nav entry that opens the email-only invite screen. Rendered after the
// collection links via admin.components.afterNavLinks. Only admins can invite,
// so only admins see the link.
export const InviteNavLink: React.FC = () => {
  const { user } = useAuth<User>();
  if (!userIsAdmin(user)) return null;

  return (
    <a
      href="/admin/invite-user"
      className="nav__link"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 0",
        fontWeight: 600,
      }}
    >
      + Invite a user
    </a>
  );
};

export default InviteNavLink;
