import { ImageResponse } from "next/og";

// Branded 1200x630 social card for the blog index — what people see when the
// homepage is shared on X, LinkedIn, WhatsApp, etc. A real card (vs. a bare
// link) lifts click-through, so it counts toward visibility, not just looks.
// Colors mirror the speechworks.app theme (orange band, ink, lime).
export const alt =
  "The Speechworks Blog: voices from people who stutter and the SLPs beside them";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ff9657",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            color: "#141311",
          }}
        >
          The Speechworks Blog
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: "-0.05em",
            color: "#141311",
            maxWidth: 1000,
          }}
        >
          Voices from people who stutter and SLPs
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 30,
            color: "#29231e",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 22,
              height: 22,
              borderRadius: 9999,
              border: "3px solid #141311",
              backgroundColor: "#b9ee55",
              marginRight: 18,
            }}
          />
          Stuttering · Stammering · Speaking up · Community
        </div>
      </div>
    ),
    { ...size },
  );
}
