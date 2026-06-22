import type { CollectionConfig, Where } from "payload";
import { isLoggedIn, isEditorField, userIsEditor } from "../access/roles";
import { stampOwner } from "../hooks/stampOwner";
import { workflowGate } from "../hooks/workflowGate";
import { ensureUniquePost } from "../hooks/uniquePost";
import { enforceCoAuthorDiscoverability } from "../hooks/coAuthorGate";
import { previewPath } from "../lib/preview";
import {
  revalidateAfterChange,
  revalidateAfterDelete,
} from "../hooks/revalidate";

const WORKFLOW_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "In review", value: "inReview" },
  { label: "Changes requested", value: "changesRequested" },
  { label: "Approved", value: "approved" },
];

// System-only audit fields: nobody can hand-edit them (the workflowGate hook fills
// them in), and each is shown read-only in the sidebar ONLY once it has a value — so
// an empty one never looks like a field you can select/pick manually.
const auditField = (name: string) => ({
  access: { update: () => false },
  admin: {
    position: "sidebar" as const,
    readOnly: true,
    condition: (data: Record<string, unknown>) => Boolean(data?.[name]),
  },
});

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "workflowStatus", "author", "_status", "updatedAt"],
    group: "Content",
    // Authors default to "My posts"; editors see everything. (Read access below
    // also hard-scopes the list, so this is convenience, not the security.)
    baseListFilter: ({ req: { user } }): Where =>
      userIsEditor(user) || !user ? {} : { owner: { equals: user.id } },
    // Draft preview: a "Preview" button + a side-by-side Live Preview view that
    // refreshes on save (see components/RefreshOnSave).
    preview: (doc) => previewPath((doc as { slug?: string }).slug),
    livePreview: {
      url: ({ data }) => previewPath((data as { slug?: string })?.slug),
    },
    components: {
      edit: {
        // Publish button locked until an editor is viewing an approved post.
        // (The status + workflow actions live in the WorkflowPanel ui field below,
        // so they get a full-width, mobile-friendly card instead of crowding the
        // Save/Publish toolbar.)
        PublishButton: "/components/admin/GatedPublishButton#GatedPublishButton",
      },
    },
  },
  // Native draft/published switch (the publish gate). maxPerDoc caps version
  // history so heavy editing can't balloon the database.
  versions: {
    maxPerDoc: 25,
    drafts: { autosave: false },
  },
  access: {
    create: isLoggedIn,
    // anon: published only · author: own + published · editor: everything
    read: ({ req: { user } }) => {
      if (userIsEditor(user)) return true;
      const published: Where = { _status: { equals: "published" } };
      if (!user) return published;
      const clauses: Where[] = [{ owner: { equals: user.id } }, published];
      return { or: clauses };
    },
    // editor: any · author: only their own, and only while editable
    update: ({ req: { user } }) => {
      if (userIsEditor(user)) return true;
      if (!user) return false;
      const clauses: Where[] = [
        { owner: { equals: user.id } },
        { workflowStatus: { in: ["draft", "changesRequested"] } },
      ];
      return { and: clauses };
    },
    delete: ({ req: { user } }) => {
      if (userIsEditor(user)) return true;
      if (!user) return false;
      return { owner: { equals: user.id } };
    },
    // Keep drafts out of the version/diff viewer for non-owners. In version
    // records the document fields are nested under `version.`, so we filter on
    // `version.owner` (querying plain `owner` here throws).
    readVersions: ({ req: { user } }) => {
      if (userIsEditor(user)) return true;
      if (!user) return false;
      return { "version.owner": { equals: user.id } } as Where;
    },
  },
  hooks: {
    beforeValidate: [enforceCoAuthorDiscoverability, ensureUniquePost],
    beforeChange: [stampOwner, workflowGate],
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    // Full-width review-status card + workflow actions (Submit / Approve / Request
    // changes), rendered at the top of the post.
    {
      name: "reviewStatus",
      type: "ui",
      admin: {
        components: { Field: "/components/admin/WorkflowPanel#WorkflowPanel" },
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
      maxLength: 140,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      // Slug is auto-filled + made unique by the ensureUniquePost collection hook.
      admin: {
        position: "sidebar",
        description:
          "Auto-filled from the title (kept unique). You can override it.",
      },
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    {
      name: "coAuthors",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      // The picker shows only addable people: an author can pick discoverable users;
      // editors can pick anyone. (The coAuthorGate hook enforces the same server-side.)
      filterOptions: ({ user }): boolean | Where =>
        userIsEditor(user)
          ? true
          : { discoverableUntil: { greater_than: new Date().toISOString() } },
      admin: { description: "Shown in the byline alongside the main author." },
    },
    {
      name: "peerReviewers",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      // SLPs only; an author is further limited to discoverable ones (editors: any).
      filterOptions: ({ user }): Where =>
        userIsEditor(user)
          ? { contributorType: { equals: "slp" } }
          : {
              and: [
                { contributorType: { equals: "slp" } },
                { discoverableUntil: { greater_than: new Date().toISOString() } },
              ],
            },
      admin: {
        description: 'SLPs who peer-reviewed this (shown as "Peer reviewed by …").',
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      maxLength: 260,
      admin: {
        description:
          "One or two sentences — used on cards and as the search-engine description.",
      },
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      filterOptions: () => ({ mimeType: { contains: "image" } }),
    },
    {
      name: "body",
      type: "richText", // editor features (incl. in-text image) added in P5
    },
    {
      name: "audio",
      type: "upload",
      relationTo: "media",
      filterOptions: () => ({ mimeType: { contains: "audio" } }),
      admin: {
        description: "Voice narration (takes priority over the link below).",
      },
    },
    {
      name: "audioUrl",
      type: "text",
      admin: {
        description:
          "Or paste an external audio link. Hidden when a file is uploaded.",
        condition: (data) => !data?.audio,
      },
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
      admin: { position: "sidebar" },
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        position: "sidebar",
        description:
          "Set automatically when the post is first published. Override to back-date.",
      },
    },
    {
      name: "workflowStatus",
      type: "select",
      options: WORKFLOW_OPTIONS,
      defaultValue: "draft",
      required: true,
      admin: {
        position: "sidebar",
        readOnly: true, // changed via the workflow buttons, not by hand
        description: "The review stage — use the buttons above the editor to change it.",
      },
    },
    {
      name: "reviewNotes",
      type: "textarea",
      access: { update: isEditorField },
      admin: {
        position: "sidebar",
        readOnly: true, // set via the "Request changes" button, not typed here
        condition: (data: Record<string, unknown>) => Boolean(data?.reviewNotes),
        description: "Editor's note when requesting changes — the author can read this.",
      },
    },
    // owner: system-only anchor for the "own posts only" rule.
    {
      name: "owner",
      type: "relationship",
      relationTo: "users",
      access: { update: () => false },
      admin: { position: "sidebar", readOnly: true, hidden: true },
    },
    // audit trail (system-only — written by the workflowGate hook).
    // The publish *date* reuses the editorial `publishedAt` above; here we record
    // who submitted/approved/published it.
    { name: "submittedBy", type: "relationship", relationTo: "users", ...auditField("submittedBy") },
    { name: "submittedAt", type: "date", ...auditField("submittedAt") },
    { name: "changesRequestedBy", type: "relationship", relationTo: "users", ...auditField("changesRequestedBy") },
    { name: "changesRequestedAt", type: "date", ...auditField("changesRequestedAt") },
    { name: "approvedBy", type: "relationship", relationTo: "users", ...auditField("approvedBy") },
    { name: "approvedAt", type: "date", ...auditField("approvedAt") },
    { name: "publishedBy", type: "relationship", relationTo: "users", ...auditField("publishedBy") },
  ],
};
