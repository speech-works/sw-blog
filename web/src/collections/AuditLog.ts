import type { CollectionConfig } from "payload";
import { isAdmin } from "../access/roles";

const never = () => false;

// Append-only activity log of significant, dispute-causing actions across the system
// (publishes, approvals, deletions, role changes, …). Visible ONLY to admins, and
// written ONLY by the audit hooks (via overrideAccess) — never by hand. It has no
// hooks of its own, so writing to it from other collections' hooks can't recurse.
export const AuditLog: CollectionConfig = {
  slug: "auditLog",
  labels: { singular: "Audit Log", plural: "Audit Log" },
  access: { read: isAdmin, create: never, update: never, delete: never },
  admin: {
    group: "Logs",
    useAsTitle: "summary",
    defaultColumns: ["createdAt", "summary", "action"],
  },
  defaultSort: "-createdAt",
  timestamps: true,
  fields: [
    { name: "summary", type: "text", admin: { readOnly: true } },
    { name: "action", type: "text", index: true, admin: { readOnly: true } },
    {
      name: "actor",
      type: "relationship",
      relationTo: "users",
      admin: { readOnly: true },
    },
    // Denormalized so the log still reads correctly after a user is deleted.
    { name: "actorName", type: "text", admin: { readOnly: true } },
    { name: "targetType", type: "text", admin: { readOnly: true } },
    { name: "targetId", type: "text", admin: { readOnly: true } },
    { name: "targetLabel", type: "text", admin: { readOnly: true } },
    { name: "meta", type: "json", admin: { readOnly: true } },
  ],
};

export default AuditLog;
