import crypto from "crypto";
import { APIError } from "payload";
import type {
  BasePayload,
  CollectionAfterOperationHook,
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  PayloadHandler,
} from "payload";
import { INVITE_EMAIL_SUBJECT, inviteEmail } from "../lib/authEmail";
import { userIsAdmin } from "../access/roles";
import { auditUserInvite } from "./audit";

// Invitations reuse Payload's reset-password token machinery: we mint a token,
// stash it on the user (resetPasswordToken/Expiration) with a 48h expiry, and
// email a branded link to /admin/reset/{token}. The built-in reset page sets the
// password; `activateOnPasswordSet` then flips `accountActivated` so the account
// is "live". Until then the user can't self-serve a reset (see the guard below) —
// the only way in is an admin-sent invite.
const INVITE_TTL_MS = 48 * 60 * 60 * 1000;

const VALID_ROLES = ["admin", "editor", "author", "reviewer"] as const;

export type InviteResult = {
  emailSent: boolean;
  reason?: "not-configured" | "send-failed";
};

// Mirror the SMTP check in payload.config.ts: if email isn't wired up we still
// write the token (so the link is testable in dev) but tell the caller nothing
// was delivered, instead of throwing into a void.
const emailConfigured = (): boolean =>
  Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );

type InviteUser = { id?: unknown; email?: unknown; [key: string]: unknown };

export const issueInviteAndEmail = async (
  payload: BasePayload,
  user: InviteUser,
): Promise<InviteResult> => {
  const id = user?.id;
  const email = typeof user?.email === "string" ? user.email.trim() : "";
  if (!email || (typeof id !== "number" && typeof id !== "string")) {
    return { emailSent: false, reason: "send-failed" };
  }

  const token = crypto.randomBytes(20).toString("hex");
  const resetPasswordExpiration = new Date(Date.now() + INVITE_TTL_MS).toISOString();

  await payload.update({
    collection: "users",
    id,
    overrideAccess: true,
    depth: 0,
    data: { resetPasswordExpiration, resetPasswordToken: token },
  });

  if (!emailConfigured()) {
    return { emailSent: false, reason: "not-configured" };
  }

  try {
    const content = inviteEmail(token, user);
    await payload.sendEmail({
      to: email,
      subject: INVITE_EMAIL_SUBJECT,
      text: content.text,
      html: content.html,
    });
    return { emailSent: true };
  } catch (error) {
    console.error("[sw-blog] invite email send failed:", error);
    return { emailSent: false, reason: "send-failed" };
  }
};

// Flip accountActivated to true for a user by id, no-op if already active.
const activateUser = async (
  req: Parameters<CollectionAfterOperationHook>[0]["req"],
  id: string | number,
  currentActivated: unknown,
): Promise<void> => {
  if (currentActivated === true) return;
  try {
    await req.payload.update({
      collection: "users",
      id,
      overrideAccess: true,
      depth: 0,
      data: { accountActivated: true },
    });
  } catch (error) {
    console.error("[sw-blog] account activation flag update failed:", error);
  }
};

// Mark an account active when a password is set:
//  - resetPassword  → invited user clicks the 48h link and sets their password
//  - create (no isInviteCreate flag) → first-admin via /admin/create-first-user
//    or admin using the default Users → Create form (both supply a real password)
//
// Invite-created accounts are excluded from the create path: inviteHandler sets
// req.context.isInviteCreate = true before calling payload.create so the random
// placeholder password doesn't count as "account set up".
export const activateOnPasswordSet: CollectionAfterOperationHook<"users"> = async ({
  operation,
  result,
  req,
}) => {
  if (operation === "resetPassword") {
    // result shape: { user: { id, accountActivated, ... } }
    const user = (result as { user?: { id?: unknown; accountActivated?: unknown } })
      ?.user;
    const id = user?.id;
    if (typeof id === "number" || typeof id === "string") {
      await activateUser(req, id, user?.accountActivated);
    }
    return result;
  }

  if (operation === "create" && !req.context?.isInviteCreate) {
    // result is the created user document
    const created = result as { id?: unknown; accountActivated?: unknown };
    const id = created?.id;
    if (typeof id === "number" || typeof id === "string") {
      await activateUser(req, id, created?.accountActivated);
    }
    return result;
  }

  return result;
};

// Block forgot-password for not-yet-activated accounts. The message is generic
// and friendly: it leaks no token/internals and doesn't confirm whether a
// specific account exists — it just points the user back to their invitation.
export const guardForgotPasswordActivation: CollectionBeforeOperationHook = async ({
  args,
  operation,
}) => {
  if (operation !== "forgotPassword") return args;

  const data = (args as { data?: { email?: unknown } }).data;
  const email =
    typeof data?.email === "string" ? data.email.trim().toLowerCase() : "";
  if (!email) return args;

  const found = await args.req.payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const user = found.docs[0] as { accountActivated?: unknown } | undefined;
  if (user && user.accountActivated !== true) {
    throw new APIError(
      "We couldn't start a password reset for that email. If you were recently invited, use the invitation link we emailed you, or ask your administrator to resend it.",
      403,
    );
  }

  return args;
};

// A name must never be SAVED empty. We allow it to be absent (system/partial
// updates that don't touch it — activation, token mint, discoverability — and
// programmatic creates), but the moment a name is part of the write we trim it
// and reject an empty/whitespace value. This keeps the public byline and the
// Users list free of blank "<No Name>" rows, and stops anyone clearing their
// name on the profile form. Runs on create + update.
export const enforceNonEmptyName: CollectionBeforeChangeHook = ({ data }) => {
  const d = data as Record<string, unknown>;
  if ("name" in d) {
    const trimmed = typeof d.name === "string" ? d.name.trim() : "";
    if (!trimmed) {
      throw new APIError("Please enter a name — it can't be empty.", 400);
    }
    d.name = trimmed; // normalize: store the trimmed value
  }
  return data;
};

// Prevent non-admins from changing their own email address. Email is the login
// key — a self-service change to a non-existent address causes instant lockout
// with no recovery path. Admins can still update it (e.g. when someone switches
// employer or email provider). The check is on the update operation only; create
// operations (invite flow, first-admin) are unaffected.
export const lockEmailForNonAdmins: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (
    operation === "update" &&
    "email" in data &&
    data.email !== originalDoc?.email &&
    !userIsAdmin(req.user)
  ) {
    throw new APIError(
      "Your email address can only be changed by an administrator. Please contact them if you need to update it.",
      403,
    );
  }
  return data;
};

// --- custom endpoints (mounted under /api/users) --------------------------------

const json = (body: unknown, status = 200): Response =>
  Response.json(body as Record<string, unknown>, { status });

const readBody = async (req: Parameters<PayloadHandler>[0]): Promise<Record<string, unknown>> => {
  try {
    if (typeof req.json === "function") {
      return ((await req.json()) ?? {}) as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return {};
};

// POST /api/users/invite  — admin-only. Creates a pending user (random password,
// no profile) and emails the invitation. If the email already belongs to a
// pending user, we resend instead of erroring.
export const inviteHandler: PayloadHandler = async (req) => {
  if (!userIsAdmin(req.user)) {
    return json({ ok: false, message: "You don't have permission to do that." }, 403);
  }

  const body = await readBody(req);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";

  if (!email || !email.includes("@")) {
    return json({ ok: false, message: "Please enter a valid email address." }, 400);
  }
  if (!name) {
    return json({ ok: false, message: "Please enter the person's name." }, 400);
  }
  if (!(VALID_ROLES as readonly string[]).includes(role)) {
    return json({ ok: false, message: "Please choose a designation for this person." }, 400);
  }

  const { payload } = req;

  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const found = existing.docs[0] as
    | { id: unknown; email?: unknown; accountActivated?: unknown }
    | undefined;

  if (found) {
    if (found.accountActivated === true) {
      return json(
        { ok: false, message: "An active account already uses this email.", id: found.id },
        409,
      );
    }
    const result = await issueInviteAndEmail(payload, found);
    await auditUserInvite(req, found as Record<string, unknown>, {
      resent: true,
      emailSent: result.emailSent,
    });
    return json({
      ok: true,
      id: found.id,
      email,
      resent: true,
      emailSent: result.emailSent,
      reason: result.reason,
    });
  }

  let created;
  try {
    // Flag the request so activateOnPasswordSet skips this creation — the random
    // placeholder password must NOT count as "account set up". Activation happens
    // when the invited user clicks the link and uses /admin/reset/{token}.
    req.context.isInviteCreate = true;
    created = await payload.create({
      collection: "users",
      req,
      data: {
        email,
        name: name || undefined,
        roles: [role as (typeof VALID_ROLES)[number]],
        password: crypto.randomBytes(32).toString("hex"),
      },
    });
    req.context.isInviteCreate = false;
  } catch (error) {
    console.error("[sw-blog] invite create failed:", error);
    const message =
      error instanceof APIError
        ? error.message
        : "Could not create this user. Please check the details and try again.";
    return json({ ok: false, message }, 400);
  }

  const result = await issueInviteAndEmail(payload, created as unknown as InviteUser);
  await auditUserInvite(req, created as unknown as Record<string, unknown>, {
    resent: false,
    emailSent: result.emailSent,
  });
  return json({
    ok: true,
    id: (created as { id: unknown }).id,
    email,
    emailSent: result.emailSent,
    reason: result.reason,
  });
};

// POST /api/users/:id/resend-invite — admin-only. Mints a fresh 48h token
// (invalidating any prior link) and re-sends the invitation.
export const resendInviteHandler: PayloadHandler = async (req) => {
  if (!userIsAdmin(req.user)) {
    return json({ ok: false, message: "You don't have permission to do that." }, 403);
  }

  const id = req.routeParams?.id;
  if (id == null) {
    return json({ ok: false, message: "Missing user id." }, 400);
  }

  const { payload } = req;
  let user;
  try {
    user = await payload.findByID({
      collection: "users",
      id: id as string | number,
      depth: 0,
      overrideAccess: true,
    });
  } catch {
    return json({ ok: false, message: "That user no longer exists." }, 404);
  }
  if (!user) {
    return json({ ok: false, message: "That user no longer exists." }, 404);
  }
  if ((user as { accountActivated?: unknown }).accountActivated === true) {
    return json({ ok: false, message: "This account is already active." }, 400);
  }

  const result = await issueInviteAndEmail(payload, user as unknown as InviteUser);
  await auditUserInvite(req, user as unknown as Record<string, unknown>, {
    resent: true,
    emailSent: result.emailSent,
  });
  return json({
    ok: true,
    email: (user as { email?: unknown }).email,
    emailSent: result.emailSent,
    reason: result.reason,
  });
};
