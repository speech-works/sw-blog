import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";
import { deskStructure } from "./structure/deskStructure";
import {
  approveAction,
  gateOwnerAction,
  gatePublishAction,
  isEditorUser,
  requestChangesAction,
  submitForReviewAction,
} from "./actions/workflowActions";
import { speechworksTheme } from "./lib/theme";
import { StudioIcon } from "./components/Logo";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID!;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";

export default defineConfig({
  name: "default",
  title: "Speechworks Studio",
  // `icon` is the supported way to set the navbar logo in current Sanity v3
  // (studio.components.logo is deprecated/ignored).
  icon: StudioIcon,
  projectId,
  dataset,
  theme: speechworksTheme,
  plugins: [
    structureTool({ structure: deskStructure }),
    visionTool({ defaultApiVersion: "2024-10-01" }),
  ],
  // Hide the Vision (GROQ query) tool from non-editors so authors can't use it to
  // browse others' content. (Soft: the raw API is still open to admins.)
  tools: (prev, context) =>
    isEditorUser(context.currentUser)
      ? prev
      : prev.filter((tool) => tool.name !== "vision"),
  schema: {
    types: schemaTypes,
  },
  document: {
    // Add the workflow actions and gate Publish behind "approved" for posts.
    actions: (prev, context) => {
      const type = context.schemaType;
      if (type !== "post" && type !== "author") return prev;

      const isEditor = isEditorUser(context.currentUser);
      const userId = context.currentUser?.id;
      const mutating = new Set([
        "publish",
        "unpublish",
        "delete",
        "duplicate",
        "discardChanges",
      ]);

      const gated = prev.map((action) => {
        // Posts: publish is editor-only and requires "approved".
        if (type === "post" && action.action === "publish") {
          return gatePublishAction(action, isEditor);
        }
        if (isEditor) return action;
        // Non-editors: mutating actions (delete, duplicate, ...) only on docs they own.
        if (action.action && mutating.has(action.action)) {
          return gateOwnerAction(action, userId);
        }
        return action;
      });

      if (type === "post") {
        // Authors get only "Submit for review"; editors also get Approve / Request changes.
        const workflow = isEditor
          ? [submitForReviewAction, approveAction, requestChangesAction]
          : [submitForReviewAction];
        return [...workflow, ...gated];
      }
      return gated;
    },
  },
});
