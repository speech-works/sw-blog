"use client";
import React from "react";

type Props = { cellData?: unknown };

// Replaces Payload's "<No alt>" fallback in the Media list with a neutral dash.
// Alt text is intentionally optional for decorative images, so empty is common.
export const AltCell: React.FC<Props> = ({ cellData }) => {
  if (!cellData) return <span style={{ opacity: 0.35 }}>—</span>;
  return <span>{String(cellData)}</span>;
};

export default AltCell;
