"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Quick-filter chips rendered above the Users list table (beforeListTable).
// Each chip navigates to a URL with Payload's WHERE clause format so the
// built-in list view handles the actual data filtering.
// useSearchParams requires a Suspense boundary — the outer component provides it.
//
// The "complete profile" definition here MUST mirror UserStatusCell's badge logic
// (name + contributorType + bio all present) or the chips and badges disagree.
// Note: Payload's `exists` operator tests for NULL, so a field cleared to an
// empty string ("") would read as "exists" — a rare edge the badge (.trim())
// catches but the filter doesn't. Unset fields are NULL, so the common case agrees.

const BASE = "/admin/collections/users";

// Shared fragments so the incomplete/active queries stay in sync.
const ACTIVATED = "where[and][0][accountActivated][equals]=true";
// Incomplete: activated AND (name OR contributorType OR bio missing).
const INCOMPLETE_QS = `${ACTIVATED}&where[and][1][or][0][name][exists]=false&where[and][1][or][1][contributorType][exists]=false&where[and][1][or][2][bio][exists]=false`;
// Fully active: activated AND name AND contributorType AND bio all present.
const ACTIVE_QS = `${ACTIVATED}&where[and][1][name][exists]=true&where[and][2][contributorType][exists]=true&where[and][3][bio][exists]=true`;

type FilterDef = {
  key: string;
  label: string;
  href: string;
  dot: string;
  isActive: (p: URLSearchParams) => boolean;
};

const FILTERS: FilterDef[] = [
  {
    key: "all",
    label: "All users",
    href: BASE,
    dot: "transparent",
    // Active only when no status filter (flat pending/deactivated param or nested and-group) is set.
    isActive: (p) =>
      !p.has("where[accountActivated][equals]") &&
      !p.has("where[and][0][accountActivated][equals]") &&
      !p.has("where[deactivated][equals]"),
  },
  {
    key: "pending",
    label: "Invitation pending",
    href: `${BASE}?where[accountActivated][equals]=false`,
    dot: "#d97706",
    isActive: (p) => p.get("where[accountActivated][equals]") === "false",
  },
  {
    key: "incomplete",
    label: "Profile incomplete",
    href: `${BASE}?${INCOMPLETE_QS}`,
    dot: "#818cf8",
    isActive: (p) => p.get("where[and][1][or][0][name][exists]") === "false",
  },
  {
    key: "active",
    label: "Fully active",
    href: `${BASE}?${ACTIVE_QS}`,
    dot: "#34d399",
    isActive: (p) => p.get("where[and][1][name][exists]") === "true",
  },
  {
    key: "deactivated",
    label: "Deactivated",
    href: `${BASE}?where[deactivated][equals]=true`,
    dot: "#64748b",
    isActive: (p) => p.get("where[deactivated][equals]") === "true",
  },
];

// Descriptions shown in the legend and as native tooltips on each chip.
const DESCRIPTIONS: Record<string, string> = {
  pending: "Invited but hasn't clicked their activation link yet.",
  incomplete: "Accepted invite but profile (name, type, bio) isn't fully filled in.",
  active: "Activated and profile is complete.",
  deactivated: "Locked out by an admin. Published posts stay intact.",
};

const Chips: React.FC = () => {
  const params = useSearchParams();

  return (
    <div style={{ padding: "10px 0 14px" }}>
      {/* ── Legend row ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "4px 18px",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: 0.4,
            whiteSpace: "nowrap",
          }}
        >
          Status key
        </span>
        {FILTERS.filter((f) => f.key !== "all").map(({ key, label, dot }) => (
          <span
            key={key}
            title={DESCRIPTIONS[key]}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              color: "var(--theme-elevation-500, #64748b)",
              whiteSpace: "nowrap",
              cursor: "default",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: dot,
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            {label}
          </span>
        ))}
      </div>

      {/* ── Filter chips row ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: 0.4,
            whiteSpace: "nowrap",
          }}
        >
          Filter by
        </span>
        {FILTERS.map(({ key, label, href, dot, isActive }) => {
          const active = isActive(params);
          return (
            <a
              key={key}
              href={href}
              title={key !== "all" ? DESCRIPTIONS[key] : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: key === "all" ? 0 : 5,
                padding: "4px 12px",
                borderRadius: 20,
                border: `1px solid ${
                  active
                    ? "var(--theme-elevation-300, #334155)"
                    : "var(--theme-elevation-200, #1e293b)"
                }`,
                background: active
                  ? "var(--theme-elevation-150, #1e293b)"
                  : "transparent",
                color: active
                  ? "var(--theme-text, inherit)"
                  : "var(--theme-elevation-500, #64748b)",
                fontWeight: active ? 600 : 400,
                fontSize: 12,
                textDecoration: "none",
                whiteSpace: "nowrap",
                lineHeight: 1.4,
              }}
            >
              {key !== "all" && (
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
              )}
              {label}
            </a>
          );
        })}
      </div>
    </div>
  );
};

export const UserListFilters: React.FC = () => (
  <Suspense fallback={null}>
    <Chips />
  </Suspense>
);

export default UserListFilters;
