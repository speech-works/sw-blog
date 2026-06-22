import React from "react";

// Small brand mark shown in the collapsed nav + breadcrumb.
// Sizing + theme-aware colour are in (payload)/admin-custom.css.
export const Icon: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="https://speechworks.app/assets/logo.png"
    alt="Speechworks"
    className="sw-admin-icon"
  />
);

export default Icon;
