import { UserIcon } from "@sanity/icons";
import { defineField, defineType } from "sanity";
import { isEditorUser } from "../actions/workflowActions";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  icon: UserIcon,
  // Stamp the creator so each author can see/keep only their own profile.
  initialValue: (_params, context) => ({
    owner: context.currentUser?.id,
  }),
  // Non-editors can edit only their own profile (soft, UI-level). Editors edit any.
  readOnly: ({ currentUser, document }) => {
    if (isEditorUser(currentUser)) return false;
    const owner = document?.owner as string | undefined;
    // A non-editor may edit a profile only if they own it (unowned/legacy = locked).
    return owner !== currentUser?.id;
  },
  fields: [
    defineField({
      name: "name",
      title: "Full name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "credentials",
      title: "Credentials",
      type: "string",
      description: 'e.g. "MS, CCC-SLP"',
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "bio",
      title: "Short bio",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "owner",
      title: "Owner",
      type: "string",
      readOnly: true,
      hidden: true,
      description: "The member who created this profile.",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "credentials", media: "photo" },
  },
});
