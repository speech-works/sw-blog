// Single source of truth for author roles WITHIN the web app (the `AuthorRole` type
// and the badge labels both derive from this one list).
//
// NOTE: this must stay in sync with the `role` enum in
// studio/schemaTypes/author.ts — they're separate builds, so it can't be imported
// directly across the two. The durable fix is Sanity TypeGen (generate web types
// from the schema); tracked as a separate task.
export const AUTHOR_ROLES = [
  { value: "pws", title: "Person who stutters" },
  { value: "slp", title: "Speech-language pathologist" },
  { value: "parent", title: "Parent / caregiver" },
  { value: "researcher", title: "Researcher" },
  { value: "ally", title: "Ally" },
] as const;

export type AuthorRole = (typeof AUTHOR_ROLES)[number]["value"];

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  AUTHOR_ROLES.map((r) => [r.value, r.title]),
);
