import type { PortableTextBlock } from "@portabletext/types";
import { stegaClean } from "next-sanity";

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

const ROLE_LABELS: Record<string, string> = {
  pws: "Person who stutters",
  slp: "Speech-language pathologist",
  parent: "Parent / caregiver",
  researcher: "Researcher",
  ally: "Ally",
};

// Human-readable badge label for an author's role; "" when unset/unknown so
// callers can simply render nothing.
export function roleLabel(role?: string): string {
  // Clean stega markers (visual-editing draft mode) before using as a lookup key.
  const cleaned = stegaClean(role);
  if (!cleaned) return "";
  return ROLE_LABELS[cleaned] ?? "";
}

// Rough reading time in minutes from Portable Text, at ~200 words/min. Always
// at least 1 so a short post never reads "0 min".
export function readingTime(blocks?: PortableTextBlock[]): number {
  if (!blocks?.length) return 1;
  const words = blocks
    .filter((block) => block._type === "block")
    .reduce((total, block) => {
      const children =
        (block as { children?: { text?: string }[] }).children ?? [];
      const text = children
        .map((child) => child.text ?? "")
        .join(" ")
        .trim();
      return total + (text ? text.split(/\s+/).length : 0);
    }, 0);
  return Math.max(1, Math.round(words / 200));
}
