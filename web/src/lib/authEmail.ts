const DEFAULT_SITE_URL = "https://blog.speechworks.app";
const BRAND_NAME = "Speechworks Blog";

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

export const siteUrl = (): string =>
  trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);

export const buildAdminResetURL = (token: string): string =>
  siteUrl() + "/admin/reset/" + encodeURIComponent(token);

const escapeHTML = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type MaybeUser = Record<string, unknown> | null | undefined;

export const userDisplayName = (user: MaybeUser): string => {
  if (typeof user?.name === "string" && user.name.trim()) return user.name.trim();
  if (typeof user?.email === "string" && user.email.trim()) return user.email.trim();
  return "there";
};

const roleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    admin: "Admin",
    editor: "Editor",
    author: "Author",
    reviewer: "Reviewer",
  };
  return labels[role] || role;
};

export const userRoleText = (user: MaybeUser): string => {
  const roles = Array.isArray(user?.roles) ? user.roles.map(String) : [];
  return roles.length ? roles.map(roleLabel).join(", ") : "Author";
};

type ActionEmailArgs = {
  buttonLabel: string;
  buttonURL: string;
  details?: string[];
  // Pass a string array to render each element as a separate paragraph — useful
  // for splitting a greeting ("Hi name,") from the body text.
  intro: string | string[];
  note?: string;
  preheader: string;
  title: string;
};

export const buildActionEmail = ({
  buttonLabel,
  buttonURL,
  details = [],
  intro,
  note,
  preheader,
  title,
}: ActionEmailArgs): { html: string; text: string } => {
  const safeButtonURL = escapeHTML(buttonURL);
  const safeDetails = details.map(escapeHTML);
  const detailHTML = safeDetails.length
    ? "<ul style=\"margin:0 0 24px;padding-left:20px;color:#334155;font-size:15px;line-height:1.6;\">" +
      safeDetails.map((detail) => "<li>" + detail + "</li>").join("") +
      "</ul>"
    : "";
  const noteHTML = note
    ? "<p style=\"margin:24px 0 0;color:#64748b;font-size:14px;line-height:1.6;\">" +
      escapeHTML(note) +
      "</p>"
    : "";

  const introParagraphs = Array.isArray(intro) ? intro : [intro];
  const introHTML = introParagraphs
    .map(
      (p) =>
        "<p style=\"margin:0 0 18px;color:#334155;font-size:16px;line-height:1.65;\">" +
        escapeHTML(p) +
        "</p>",
    )
    .join("");

  const html =
    "<!doctype html>" +
    "<html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head>" +
    "<body style=\"margin:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;\">" +
    "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0;\">" +
    escapeHTML(preheader) +
    "</div>" +
    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f6f8fb;padding:32px 16px;\"><tr><td align=\"center\">" +
    "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;\">" +
    "<tr><td style=\"padding:28px 32px 18px;border-bottom:1px solid #eef2f7;\">" +
    "<div style=\"font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#0f766e;\">" +
    BRAND_NAME +
    "</div>" +
    "<h1 style=\"margin:14px 0 0;font-size:26px;line-height:1.25;color:#111827;\">" +
    escapeHTML(title) +
    "</h1>" +
    "</td></tr>" +
    "<tr><td style=\"padding:28px 32px 32px;\">" +
    introHTML +
    detailHTML +
    "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\"><tr><td bgcolor=\"#111827\" style=\"border-radius:8px;\">" +
    "<a href=\"" +
    safeButtonURL +
    "\" style=\"display:inline-block;padding:13px 18px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;\">" +
    escapeHTML(buttonLabel) +
    "</a>" +
    "</td></tr></table>" +
    "<p style=\"margin:22px 0 0;color:#64748b;font-size:13px;line-height:1.6;\">If the button does not work, copy and paste this link into your browser:<br><a href=\"" +
    safeButtonURL +
    "\" style=\"color:#0f766e;word-break:break-all;\">" +
    safeButtonURL +
    "</a></p>" +
    noteHTML +
    "</td></tr>" +
    "</table>" +
    "<p style=\"max-width:560px;margin:18px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;text-align:center;\">This is an automated account email from " +
    BRAND_NAME +
    ".</p>" +
    "</td></tr></table>" +
    "</body></html>";

  const text = [
    BRAND_NAME,
    "",
    title,
    "",
    ...introParagraphs,
    "",
    ...details,
    "",
    buttonLabel + ":",
    buttonURL,
    note ? "" : undefined,
    note,
  ]
    .filter((line): line is string => typeof line === "string")
    .join("\n");

  return { html, text };
};

export const resetPasswordEmail = (token: string, user: MaybeUser) => {
  const resetURL = buildAdminResetURL(token);
  const name = userDisplayName(user);
  return buildActionEmail({
    buttonLabel: "Reset password",
    buttonURL: resetURL,
    intro: [
      "Hi " + name + ",",
      "Use the secure link below to reset your Speechworks Blog password.",
    ],
    note:
      "If you did not request a password reset, you can safely ignore this email. This link expires in 1 hour.",
    preheader: "Reset your Speechworks Blog password.",
    title: "Reset your password",
  });
};

export const INVITE_EMAIL_SUBJECT = "You're invited to Speechworks Blog";

export const inviteEmail = (token: string, user: MaybeUser) => {
  const setupURL = buildAdminResetURL(token);
  const name = userDisplayName(user);
  const roleText = userRoleText(user);
  return buildActionEmail({
    buttonLabel: "Set your password",
    buttonURL: setupURL,
    details: ["Role: " + roleText],
    intro: [
      "Hi " + name + ",",
      "You've been invited to join the Speechworks Blog team. Set your password to activate your account and start contributing.",
    ],
    note: "This invitation link expires in 48 hours. If it expires, ask your administrator to resend it.",
    preheader: "You've been invited to Speechworks Blog.",
    title: "You're invited to Speechworks Blog",
  });
};
