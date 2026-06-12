import { CheckmarkCircleIcon, EditIcon, ResetIcon } from "@sanity/icons";
import {
  useDocumentOperation,
  type DocumentActionComponent,
  type DocumentActionProps,
} from "sanity";

// Editors allowed to Approve + Publish. Sanity's free tier only has admin/viewer
// roles (everyone who can write is an "administrator"), so we separate authors from
// editors with an email allow-list instead of a real role.
//
// IMPORTANT: add the email of every approver here (lowercase), then redeploy the
// Studio (`npx sanity deploy`). If this list is empty, NOBODY can approve/publish.
export const EDITORS: string[] = [
  // "you@speechworks.in",
];

export function isEditorUser(
  user: { email?: string | null } | null | undefined,
): boolean {
  const email = user?.email?.toLowerCase();
  return !!email && EDITORS.map((e) => e.toLowerCase()).includes(email);
}

// NOTE (honest caveat): this is still UI-level. An editor-email user is technically
// an administrator and could bypass via the raw API. Hard enforcement (authors
// physically cannot publish) needs paid custom roles. For a small trusted team this
// allow-list is the intended, accepted behaviour.

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
