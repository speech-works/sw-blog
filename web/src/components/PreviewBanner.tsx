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
    <div className="preview-banner">
      <span>Preview mode — showing the latest draft.</span>
      <a href="/next/exit-preview">
        Exit preview
      </a>
    </div>
  );
}
