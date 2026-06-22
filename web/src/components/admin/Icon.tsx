import React from "react";

// Small brand mark shown in the collapsed admin nav.
export const Icon: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="https://speechworks.app/assets/logo.png"
    alt="Speechworks"
    style={{ height: 24, width: 24, objectFit: "contain" }}
  />
);

export default Icon;
