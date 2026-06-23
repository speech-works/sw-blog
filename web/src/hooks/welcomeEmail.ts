import crypto from "crypto";
import type { CollectionAfterChangeHook } from "payload";

const DEFAULT_SITE_URL = "https://blog.speechworks.app";
const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

const escapeHTML = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const userName = (user: Record<string, unknown>): string => {
  if (typeof user.name === "string" && user.name.trim()) return user.name.trim();
  if (typeof user.email === "string" && user.email.trim()) return user.email.trim();
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

const getRoleText = (user: Record<string, unknown>): string => {
  const roles = Array.isArray(user.roles) ? user.roles.map(String) : [];
  return roles.length ? roles.map(roleLabel).join(", ") : "Author";
};

const buildResetURL = (token: string): string => {
  const siteURL = trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
  return siteURL + "/admin/reset/" + token;
};

const getFromAddress = (): string =>
  process.env.EMAIL_FROM_ADDRESS || "no-reply@speechworks.app";

const getFromName = (): string =>
  process.env.EMAIL_FROM_NAME || "Speechworks Blog";

export const sendWelcomeEmail: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== "create") return doc;

  const user = doc as Record<string, unknown>;
  const id = user.id;
  const email = typeof user.email === "string" ? user.email.trim() : "";
  if (!email || (typeof id !== "number" && typeof id !== "string")) return doc;

  try {
    const token = crypto.randomBytes(20).toString("hex");
    const resetPasswordExpiration = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

    await req.payload.update({
      collection: "users",
      id,
      overrideAccess: true,
      depth: 0,
      data: {
        resetPasswordExpiration,
        resetPasswordToken: token,
      },
    });

    const name = userName(user);
    const roleText = getRoleText(user);
    const resetURL = buildResetURL(token);
    const safeName = escapeHTML(name);
    const safeRoleText = escapeHTML(roleText);
    const safeResetURL = escapeHTML(resetURL);
    const fromAddress = getFromAddress();
    const fromName = getFromName();

    await req.payload.sendEmail({
      to: email,
      from: "\"" + fromName + "\" <" + fromAddress + ">",
      subject: "Welcome to Speechworks Blog",
      text:
        "Hi " +
        name +
        ",\n\nYour Speechworks Blog account has been created.\n\nRole: " +
        roleText +
        "\n\nSet your password and sign in here:\n" +
        resetURL +
        "\n\nThis link expires in 24 hours.\n\nSpeechworks Blog",
      html:
        "<p>Hi " +
        safeName +
        ",</p>" +
        "<p>Your Speechworks Blog account has been created.</p>" +
        "<p><strong>Role:</strong> " +
        safeRoleText +
        "</p>" +
        "<p><a href=\"" +
        safeResetURL +
        "\">Set your password and sign in</a></p>" +
        "<p>This link expires in 24 hours.</p>" +
        "<p>Speechworks Blog</p>",
    });
  } catch (error) {
    console.error("[sw-blog] welcome email send failed:", error);
  }

  return doc;
};
