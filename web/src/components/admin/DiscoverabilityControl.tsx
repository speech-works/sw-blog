"use client";
import React, { useEffect, useState } from "react";
import { useDocumentInfo, useField, useFormModified } from "@payloadcms/ui";

// One-click discoverability control with a live status line. Replaces the raw
// "window" dropdown + "discoverable until" date. Buttons PATCH the user's window;
// the server hook recomputes the expiry. The countdown is display-only (a UI
// timer) — discoverability itself is just "expiry > now", checked when someone
// looks you up.
const OPTIONS = [
  { label: "Hidden", value: "hidden" },
  { label: "1 hour", value: "1hour" },
  { label: "8 hours", value: "8hours" },
  { label: "Always", value: "always" },
];

function describe(until: unknown): { live: boolean; text: string } {
  if (typeof until !== "string" || !until) {
    return { live: false, text: "Hidden — other authors can't find you." };
  }
  const ts = new Date(until).getTime();
  if (Number.isNaN(ts)) return { live: false, text: "Hidden." };
  if (new Date(until).getUTCFullYear() >= 9999) {
    return { live: true, text: "Always discoverable." };
  }
  const ms = ts - Date.now();
  if (ms <= 0) return { live: false, text: "Hidden — your window has expired." };
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return {
    live: true,
    text: `Discoverable for another ${h > 0 ? `${h}h ${m}m` : `${m}m`}.`,
  };
}

export const DiscoverabilityControl: React.FC = () => {
  const { value: until } = useField<string>({ path: "discoverableUntil" });
  const { value: windowValue } = useField<string>({
    path: "discoverabilityWindow",
  });
  const { id } = useDocumentInfo();
  const modified = useFormModified();
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);

  // Re-render every 30s so the countdown stays current.
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const { live, text } = describe(until);

  const choose = async (choice: string) => {
    if (!id) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${id}?depth=0`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discoverabilityWindow: choice }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        window.alert(body?.errors?.[0]?.message ?? "Could not update discoverability.");
        return;
      }
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Discoverability</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: live ? "#22c55e" : "#9ca3af",
          }}
        />
        <span style={{ fontSize: 13 }}>{text}</span>
      </div>
      {modified ? (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Save your profile first to change discoverability.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {OPTIONS.map((o) => {
            const active = o.value === windowValue;
            return (
              <button
                key={o.value}
                type="button"
                disabled={busy}
                onClick={() => choose(o.value)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: busy ? "default" : "pointer",
                  border: "1px solid var(--theme-elevation-200)",
                  background: active
                    ? "var(--theme-elevation-150)"
                    : "transparent",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: 12, opacity: 0.6, marginTop: 10, maxWidth: 460 }}>
        Lets other authors find you (to add you as a co-author) for a limited
        time. No timer runs in the background — your window simply expires at the
        time shown above.
      </p>
    </div>
  );
};

export default DiscoverabilityControl;
