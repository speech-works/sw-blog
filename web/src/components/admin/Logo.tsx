import React from "react";

// Brand logo shown on the admin login screen + nav header.
export const Logo: React.FC = () => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src="https://speechworks.app/assets/logo.png"
    alt="Speechworks"
    style={{ height: 40, width: "auto", objectFit: "contain" }}
  />
);

export default Logo;
