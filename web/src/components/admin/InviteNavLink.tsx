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
    <a href="/admin/invite-user" className="sw-invite-link">
      <span className="sw-invite-link__icon" aria-hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
      </span>
      Invite a user
    </a>
  );
};

export default InviteNavLink;
