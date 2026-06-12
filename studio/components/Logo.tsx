import React from "react";

// Workspace icon shown in the Studio navbar (set via `icon` in sanity.config.ts).
// The mark is a wide soundwave, so we size by height and let width follow.
export function StudioIcon() {
  return (
    <img
      src="https://speechworks.app/assets/logo.png"
      alt="Speechworks"
      style={{
        height: 20,
        width: "auto",
        objectFit: "contain",
        display: "block",
        transform: "translateY(4px)",
      }}
    />
  );
}
