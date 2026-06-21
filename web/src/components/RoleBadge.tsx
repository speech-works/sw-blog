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

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full border border-brand/25 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600 ${className}`}
    >
      {label}
    </span>
  );
}
