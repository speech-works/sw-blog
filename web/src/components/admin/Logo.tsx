import React from "react";

// Brand logo (the Speechworks soundwave) shown on the admin login screen + nav.
// Sizing + theme-aware colour are in (payload)/admin-custom.css.
export const Logo: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="https://speechworks.app/assets/logo.png"
    alt="Speechworks"
    className="sw-admin-logo"
  />
);

export default Logo;
