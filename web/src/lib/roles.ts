// Single source of truth for contributor types (the public "who is speaking"
// badge). The `AuthorRole` type, the badge labels, and the Payload Users
// `contributorType` field options all derive from this one list.
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
