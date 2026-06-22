"use client";
import React from "react";
import {
  PublishButton,
  useAuth,
  useFormFields,
  useFormModified,
} from "@payloadcms/ui";
import type { User } from "../../payload-types";
import { userIsAdmin, userIsEditor } from "../../access/roles";

// Wraps Payload's native Publish button. It only appears when an editor is viewing
// an *approved* post with NO unsaved edits. Otherwise it shows a locked label with
// the reason. (The server publish-gate hook is the hard enforcement; this is the UX.)
//
// Blocking publish while the form is modified is what makes "re-review on edit"
// airtight: you can't edit an approved post and publish in one step. You must Save
// first, and saving an approved post sends it back to In review for re-approval.
// Admins are exempt (they can publish their edits directly).
export const GatedPublishButton: React.FC = () => {
  const { user } = useAuth<User>();
  const status = useFormFields(
    ([fields]) => fields?.workflowStatus?.value as string | undefined,
  );
  const modified = useFormModified();
  const isEditor = userIsEditor(user);
  const isAdmin = userIsAdmin(user);

  if (isEditor && status === "approved" && (isAdmin || !modified)) {
    return <PublishButton />;
  }

  const reason = !isEditor
    ? "Only an editor can publish."
    : status !== "approved"
      ? "The post must be Approved before it can be published."
      : "Save your changes first — editing sends the post back for review.";

  return (
    <span
      title={reason}
      style={{
        opacity: 0.5,
        cursor: "not-allowed",
        fontSize: 13,
        alignSelf: "center",
        whiteSpace: "nowrap",
      }}
    >
      🔒 Publish
    </span>
  );
};

export default GatedPublishButton;
