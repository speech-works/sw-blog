import { DocumentTextIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { isEditorUser } from "../actions/workflowActions";

export const WORKFLOW_STATES = [
  { title: "Draft", value: "draft" },
  { title: "In review", value: "inReview" },
  { title: "Approved", value: "approved" },
  { title: "Published", value: "published" },
] as const;

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  icon: DocumentTextIcon,
  // Stamp the creating member so each author's view can filter to their own posts.
  initialValue: (_params, context) => ({
    owner: context.currentUser?.id,
  }),
  // Non-editors can edit only their own posts (soft, UI-level). Editors edit any.
  readOnly: ({ currentUser, document }) => {
    if (isEditorUser(currentUser)) return false;
    const owner = document?.owner as string | undefined;
    // A non-editor may edit a post only if they own it (unowned/legacy = locked).
    return owner !== currentUser?.id;
  },
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "meta", title: "Metadata" },
    { name: "workflow", title: "Workflow" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "coAuthors",
      title: "Co-authors",
      type: "array",
      of: [{ type: "reference", to: [{ type: "author" }] }],
      group: "content",
      description:
        "Optional. Additional authors, shown in the byline alongside the main author.",
    }),
    defineField({
      name: "peerReviewers",
      title: "Peer reviewers (SLPs)",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "author" }],
          options: { filter: 'role == "slp"' },
        },
      ],
      group: "content",
      description:
        "Optional. SLP(s) who peer-reviewed this post. Shown as “Peer reviewed by …”. Separate from the Speechworks editorial check before publishing.",
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      group: "content",
      description: "One or two sentences. Used on cards and as the meta description.",
      validation: (rule) => rule.max(260),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alt text" }],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "blockContent",
      group: "content",
    }),
    defineField({
      name: "audio",
      title: "Audio narration (upload)",
      type: "file",
      group: "content",
      options: { accept: "audio/*" },
      description:
        "Optional. Upload a recording of this article (e.g. an MP3) to show a “Listen” player. Takes priority over the link below.",
    }),
    defineField({
      name: "audioUrl",
      title: "Audio narration (link)",
      type: "url",
      group: "content",
      description:
        "Optional. Instead of uploading, link to externally-hosted audio. Used only if no file is uploaded above.",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      group: "meta",
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      group: "meta",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "workflowStatus",
      title: "Workflow status",
      type: "string",
      group: "workflow",
      description:
        "Authors submit for review; an editor approves before the post can be published.",
      options: { list: [...WORKFLOW_STATES], layout: "radio" },
      initialValue: "draft",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "owner",
      title: "Owner",
      type: "string",
      group: "workflow",
      readOnly: true,
      hidden: true,
      description:
        "The member who created this post. Used to show each author only their own posts.",
    }),
  ],
  preview: {
    select: {
      title: "title",
      author: "author.name",
      status: "workflowStatus",
      media: "coverImage",
    },
    prepare({ title, author, status, media }) {
      const label =
        WORKFLOW_STATES.find((s) => s.value === status)?.title ?? "Draft";
      return {
        title,
        subtitle: [author, label].filter(Boolean).join("  ·  "),
        media,
      };
    },
  },
});
