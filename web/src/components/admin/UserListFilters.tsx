"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Quick-filter chips rendered above the Users list table (beforeListTable).
// Each chip navigates to a URL with Payload's WHERE clause format so the
// built-in list view handles the actual data filtering. The chips double as the
// colour legend (each carries its status dot + a hover tooltip), so there's no
// separate legend row. Styling lives in (payload)/admin-custom.css (.sw-uf*).
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
  description?: string;
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
    description: "Invited but hasn't clicked their activation link yet.",
    isActive: (p) => p.get("where[accountActivated][equals]") === "false",
  },
  {
    key: "incomplete",
    label: "Profile incomplete",
    href: `${BASE}?${INCOMPLETE_QS}`,
    dot: "#818cf8",
    description:
      "Accepted the invite, but name, contributor type or bio isn't filled in yet.",
    isActive: (p) => p.get("where[and][1][or][0][name][exists]") === "false",
  },
  {
    key: "active",
    label: "Fully active",
    href: `${BASE}?${ACTIVE_QS}`,
    dot: "#34d399",
    description: "Activated and profile is complete.",
    isActive: (p) => p.get("where[and][1][name][exists]") === "true",
  },
  {
    key: "deactivated",
    label: "Deactivated",
    href: `${BASE}?where[deactivated][equals]=true`,
    dot: "#64748b",
    description: "Locked out by an admin. Published posts stay intact.",
    isActive: (p) => p.get("where[deactivated][equals]") === "true",
  },
];

const Chips: React.FC = () => {
  const params = useSearchParams();
  const activeFilter = FILTERS.find((f) => f.isActive(params));
  const hint =
    activeFilter && activeFilter.key !== "all"
      ? activeFilter.description
      : "Showing everyone. Pick a status to narrow the list.";

  return (
    <div className="sw-uf">
      <div className="sw-uf__row">
        {FILTERS.map(({ key, label, href, dot, description, isActive }) => {
          const active = isActive(params);
          const tinted = key !== "all";
          return (
            <a
              key={key}
              href={href}
              title={description}
              className={[
                "sw-uf__chip",
                active && "sw-uf__chip--active",
                active && tinted && "sw-uf__chip--tinted",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ ["--sw-c" as string]: dot } as React.CSSProperties}
            >
              {tinted && <span className="sw-uf__dot" aria-hidden />}
              {label}
            </a>
          );
        })}
      </div>
      <div className="sw-uf__hint">{hint}</div>
    </div>
  );
};

export const UserListFilters: React.FC = () => (
  <Suspense fallback={null}>
    <Chips />
  </Suspense>
);

export default UserListFilters;
