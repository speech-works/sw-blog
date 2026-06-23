import crypto from "crypto";
import type { CollectionAfterChangeHook } from "payload";
import { welcomeEmail } from "../lib/authEmail";

const RESET_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

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

    const emailContent = welcomeEmail(token, user);

    await req.payload.sendEmail({
      to: email,
      subject: "Welcome to Speechworks Blog",
      text: emailContent.text,
      html: emailContent.html,
    });
  } catch (error) {
    console.error("[sw-blog] welcome email send failed:", error);
  }

  return doc;
};
