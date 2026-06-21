"use client";

import { useIsPresentationTool } from "next-sanity/hooks";

// A small "exit preview" button, shown only when Draft Mode is on AND we're NOT
// inside the Studio's Presentation iframe (there, the Studio controls the mode).
export default function DisableDraftMode() {
  const isPresentationTool = useIsPresentationTool();
  if (isPresentationTool) return null;

  return (
    <a
      href="/api/draft-mode/disable"
      className="fixed bottom-4 right-4 z-50 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg"
    >
      Exit preview
    </a>
  );
}
