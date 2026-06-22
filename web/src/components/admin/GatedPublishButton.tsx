"use client";
import React from "react";
import { PublishButton, useAuth, useFormFields } from "@payloadcms/ui";
import type { User } from "../../payload-types";
import { userIsEditor } from "../../access/roles";

// Wraps Payload's native Publish button: it only appears when an editor is
// viewing an *approved* post. Otherwise it shows a locked label with the reason.
// (The server publish-gate hook is the hard enforcement; this is the UX.)
export const GatedPublishButton: React.FC = () => {
  const { user } = useAuth<User>();
  const status = useFormFields(
    ([fields]) => fields?.workflowStatus?.value as string | undefined,
  );
  const isEditor = userIsEditor(user);

  if (isEditor && status === "approved") return <PublishButton />;

  const reason = !isEditor
    ? "Only an editor can publish."
    : "The post must be Approved before it can be published.";

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
