import { buildLegacyTheme } from "sanity";

// Speechworks brand palette applied to the Studio chrome so the author portal
// feels like a Speechworks product, not a generic Sanity install.
const props = {
  brand: "#F28044", // brand orange
  brandDark: "#D9692E",
  brown: "#401B00", // deep brand brown (top navigation)
  text: "#3F332D",
  gray: "#8C7C73",
  white: "#FFFFFF",
};

export const speechworksTheme = buildLegacyTheme({
  "--black": props.text,
  "--white": props.white,

  "--gray": props.gray,
  "--gray-base": props.gray,

  "--component-bg": props.white,
  "--component-text-color": props.text,

  "--brand-primary": props.brand,

  "--default-button-color": props.gray,
  "--default-button-primary-color": props.brand,
  "--default-button-success-color": "#43D675",
  "--default-button-warning-color": "#F5A623",
  "--default-button-danger-color": "#F03E2F",

  "--state-info-color": props.brand,
  "--state-success-color": "#43D675",
  "--state-warning-color": "#F5A623",
  "--state-danger-color": "#F03E2F",

  "--main-navigation-color": props.brown,
  "--main-navigation-color--inverted": props.white,

  "--focus-color": props.brand,
});
