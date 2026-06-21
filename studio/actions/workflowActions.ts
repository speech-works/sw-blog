import { CheckmarkCircleIcon, EditIcon, ResetIcon } from "@sanity/icons";
import {
  useDocumentOperation,
  type DocumentActionComponent,
  type DocumentActionProps,
} from "sanity";

// Editors allowed to Approve + Publish, separated from regular authors by an email
// allow-list (the free tier has no real per-user roles).
//
// The list comes from the SANITY_STUDIO_EDITORS env var (comma-separated) so the
// emails live in studio/.env + the deploy environment, never in this public repo.
// Set it, then redeploy the Studio (`npm run deploy`). If unset, NOBODY can publish.
const EDITORS: string[] = (process.env.SANITY_STUDIO_EDITORS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isEditorUser(
  user: { email?: string | null } | null | undefined,
): boolean {
  const email = user?.email?.toLowerCase();
  return !!email && EDITORS.includes(email);
}

// This is UI-level enforcement; hard per-user enforcement needs paid Sanity custom
// roles. The trade-offs are documented in the internal team runbook, not here.

function getStatus(props: DocumentActionProps): string | undefined {
  const doc = (props.draft || props.published) as
    | { workflowStatus?: string }
    | null;
  return doc?.workflowStatus;
}

export const submitForReviewAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type);
  const status = getStatus(props);
  if (status === "inReview" || status === "approved") return null;
  return {
    label: "Submit for review",
    icon: EditIcon,
    onHandle: () => {
      patch.execute([{ set: { workflowStatus: "inReview" } }]);
      props.onComplete();
    },
  };
};

export const approveAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type);
  const status = getStatus(props);
  if (status !== "inReview") return null;
  return {
    label: "Approve",
    icon: CheckmarkCircleIcon,
    tone: "positive",
    onHandle: () => {
      patch.execute([{ set: { workflowStatus: "approved" } }]);
      props.onComplete();
    },
  };
};

export const requestChangesAction: DocumentActionComponent = (props) => {
  const { patch } = useDocumentOperation(props.id, props.type);
  const status = getStatus(props);
  if (status !== "inReview" && status !== "approved") return null;
  return {
    label: "Request changes",
    icon: ResetIcon,
    tone: "caution",
    onHandle: () => {
      patch.execute([{ set: { workflowStatus: "draft" } }]);
      props.onComplete();
    },
  };
};

// Wrap the default Publish action: only editors can publish, and only once the post
// is "approved".
export function gatePublishAction(
  original: DocumentActionComponent,
  isEditor: boolean,
): DocumentActionComponent {
  const Gated: DocumentActionComponent = (props) => {
    const action = original(props);
    if (!action) return action;
    if (!isEditor) {
      return { ...action, disabled: true, title: "Only an editor can publish." };
    }
    const status = getStatus(props);
    if (status !== "approved") {
      return {
        ...action,
        disabled: true,
        title: 'Mark the post as "Approved" before publishing.',
      };
    }
    return action;
  };
  return Gated;
}

// Hide a mutating action (delete, duplicate, unpublish, ...) unless the current
// non-editor owns the document. Editors are exempted by the caller.
export function gateOwnerAction(
  original: DocumentActionComponent,
  userId: string | undefined,
): DocumentActionComponent {
  const Gated: DocumentActionComponent = (props) => {
    const action = original(props);
    if (!action) return action;
    const doc = (props.draft || props.published) as { owner?: string } | null;
    const owner = doc?.owner;
    if (owner && owner === userId) return action;
    return null;
  };
  return Gated;
}
