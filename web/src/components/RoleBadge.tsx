import { roleLabel } from "@/lib/format";

// A small "who is speaking" pill (Person who stutters / SLP / Parent …). Renders
// nothing when the author has no role set, so it's safe to drop in anywhere.
export default function RoleBadge({
  role,
  className = "",
}: {
  role?: string;
  className?: string;
}) {
  const label = roleLabel(role);
  if (!label) return null;

  return <span className={`role-pill ${className}`}>{label}</span>;
}
