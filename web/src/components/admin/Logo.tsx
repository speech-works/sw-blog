import React from "react";

// Brand logo (the Speechworks soundwave) shown on the admin login screen + nav.
// Theme-aware: white in dark mode, original brown in light mode — so it stays
// visible on both backgrounds.
export const Logo: React.FC = () => (
  <>
    <style>{`
      .sw-admin-logo { height: 52px; width: auto; object-fit: contain; }
      [data-theme="dark"] .sw-admin-logo { filter: brightness(0) invert(1); }
    `}</style>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="https://speechworks.app/assets/logo.png"
      alt="Speechworks"
      className="sw-admin-logo"
    />
  </>
);

export default Logo;
