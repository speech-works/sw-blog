import React from "react";

// Small brand mark shown in the collapsed nav + breadcrumb. Theme-aware: white in
// dark mode, original brown in light mode. Width is auto so the wide soundwave
// keeps its aspect ratio (not squished into a square).
export const Icon: React.FC = () => (
  <>
    <style>{`
      .sw-admin-icon { height: 28px; width: auto; object-fit: contain; }
      [data-theme="dark"] .sw-admin-icon { filter: brightness(0) invert(1); }
    `}</style>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="https://speechworks.app/assets/logo.png"
      alt="Speechworks"
      className="sw-admin-icon"
    />
  </>
);

export default Icon;
