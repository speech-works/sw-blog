"use client";
import React from "react";
import { useAuth } from "@payloadcms/ui";
import type { User } from "../../payload-types";

// Dashboard banner shown when the logged-in user's profile is missing fields
// that matter for public bylines and reader trust. Disappears once the profile
// is complete (on next page load after saving).
export const ProfileCompleteGuide: React.FC = () => {
  const { user } = useAuth<User>();
  if (!user) return null;

  const missing: string[] = [];
  if (!user.name?.trim()) missing.push("your name");
  if (!user.contributorType) missing.push("your contributor type");
  if (!user.bio?.trim()) missing.push("a short bio");

  if (missing.length === 0) return null;

  const last = missing[missing.length - 1];
  const fieldList =
    missing.length === 1
      ? missing[0]
      : missing.slice(0, -1).join(", ") + " and " + last;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        margin: "0 0 16px",
        padding: "14px 18px",
        borderRadius: 10,
        background: "#eff6ff",
        border: "1px solid #bfdbfe",
        color: "#1e40af",
      }}
    >
      <div style={{ fontSize: 14, lineHeight: 1.55 }}>
        <strong>Your profile isn&rsquo;t complete yet.</strong>
        {" "}Add {fieldList} so your byline looks great and readers can connect with your work.
      </div>
      <a
        href={`/admin/collections/users/${user.id}`}
        style={{
          flexShrink: 0,
          padding: "7px 14px",
          background: "#1d4ed8",
          color: "#fff",
          borderRadius: 6,
          fontWeight: 700,
          fontSize: 13,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        Complete profile →
      </a>
    </div>
  );
};

export default ProfileCompleteGuide;
