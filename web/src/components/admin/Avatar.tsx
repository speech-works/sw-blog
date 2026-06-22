"use client";
import React from "react";
import { useAuth } from "@payloadcms/ui";
import type { User } from "../../payload-types";

// The admin top-right avatar. By default Payload shows a generic icon; this makes
// it use the logged-in user's uploaded Photo, falling back to their initial.
export const AdminAvatar: React.FC = () => {
  const { user } = useAuth<User>();
  const photo = user?.photo;
  const url =
    photo && typeof photo === "object"
      ? (photo.sizes?.avatar?.url ?? photo.url ?? null)
      : null;

  // Payload's nav avatar is small; size it explicitly so the image doesn't
  // render at its natural (160px) dimensions.
  const wrap: React.CSSProperties = {
    width: 25,
    height: 25,
    borderRadius: "50%",
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  if (url) {
    return (
      <span style={wrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </span>
    );
  }

  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
  return (
    <span
      style={{
        ...wrap,
        background: "var(--theme-elevation-150)",
        fontWeight: 600,
        fontSize: 11,
      }}
    >
      {initial}
    </span>
  );
};

export default AdminAvatar;
