import { ROLE_LABELS } from "./roles";
import type { LexicalBody } from "./types";

export function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function byline(name?: string, credentials?: string): string {
  if (!name) return "";
  return credentials ? `${name}, ${credentials}` : name;
}

// Join a list of names into "A", "A & B", or "A, B & C".
export function joinNames(names: string[]): string {
  const list = names.filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  if (list.length === 2) return `${list[0]} & ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} & ${list[list.length - 1]}`;
}

// Human-readable badge label for a contributor type; "" when unset/unknown so
// callers can simply render nothing.
export function roleLabel(role?: string): string {
  if (!role) return "";
  return ROLE_LABELS[role] ?? "";
}

// Recursively pull plain text out of a Lexical editor state for word counting.
function lexicalText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as {
    text?: string;
    children?: unknown[];
    root?: { children?: unknown[] };
  };
  if (typeof n.text === "string") return n.text;
  const children = n.children ?? n.root?.children;
  if (Array.isArray(children)) return children.map(lexicalText).join(" ");
  return "";
}

// Rough reading time in minutes from the Lexical body, at ~200 words/min. Always
// at least 1 so a short post never reads "0 min".
export function readingTime(body?: LexicalBody): number {
  const text = lexicalText(body).trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 200));
}
