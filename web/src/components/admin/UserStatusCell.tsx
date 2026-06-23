"use client";
import React from "react";

// Props passed by Payload to a custom Cell component.
type Props = {
  cellData?: unknown;
  rowData?: Record<string, unknown>;
};

type StatusInfo = {
  label: string;
  dot: string;
  bg: string;
  color: string;
};

// Status derived from row data — the Cell receives the full document so we can
// check multiple fields without extra API calls. Deactivated takes priority.
const derive = (row: Record<string, unknown>): StatusInfo => {
  if (row.deactivated === true) {
    return {
      label: "Deactivated",
      dot: "#64748b",
      bg: "rgba(100,116,139,0.15)",
      color: "#94a3b8",
    };
  }
  if (row.accountActivated !== true) {
    return {
      label: "Invitation pending",
      dot: "#d97706",
      bg: "rgba(251,191,36,0.13)",
      color: "#fbbf24",
    };
  }
  const hasName = Boolean((row.name as string | null | undefined)?.trim());
  const hasType = Boolean(row.contributorType);
  const hasBio = Boolean((row.bio as string | null | undefined)?.trim());
  if (!hasName || !hasType || !hasBio) {
    return {
      label: "Profile incomplete",
      dot: "#818cf8",
      bg: "rgba(99,102,241,0.13)",
      color: "#a5b4fc",
    };
  }
  return {
    label: "Active",
    dot: "#34d399",
    bg: "rgba(16,185,129,0.13)",
    color: "#34d399",
  };
};

export const UserStatusCell: React.FC<Props> = ({ rowData = {} }) => {
  const { label, dot, bg, color } = derive(rowData);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px 3px 6px",
        borderRadius: 20,
        background: bg,
        fontSize: 11,
        fontWeight: 600,
        color,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
};

export default UserStatusCell;
