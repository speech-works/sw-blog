"use client";
import React from "react";

type Props = { cellData?: unknown };

// Replaces Payload's "<No Email>" fallback with a neutral dash so the list
// doesn't look like broken data when an email is hidden or absent.
export const EmailCell: React.FC<Props> = ({ cellData }) => {
  if (!cellData) return <span style={{ opacity: 0.35 }}>—</span>;
  return <span>{String(cellData)}</span>;
};

export default EmailCell;
