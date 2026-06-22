"use client";
import { useEffect, useState } from "react";

// Shown only in a standalone preview tab (the "open in new tab" preview). Hidden
// inside the admin Live Preview iframe, so its Exit link can't accidentally end
// the live session.
export default function PreviewBanner() {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    setStandalone(window.self === window.top);
  }, []);
  if (!standalone) return null;
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <span>Preview mode — showing the latest draft.</span>
      <a href="/next/exit-preview" className="font-semibold underline">
        Exit preview
      </a>
    </div>
  );
}
