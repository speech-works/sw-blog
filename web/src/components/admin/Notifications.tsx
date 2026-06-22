"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@payloadcms/ui";
import type { User } from "../../payload-types";
import { userIsEditor } from "../../access/roles";

// A login-time "review queue" shown on the dashboard. It derives everything from the
// current post states (no separate notifications table — zero extra storage), so it's
// always accurate. Editors see what needs reviewing/publishing; authors see where
// their own posts stand and what needs their attention.

type PostLite = { id: string | number; title?: string };
type Row = { key: string; tone: string; head: string; items: PostLite[] };

const fetchPosts = async (
  where: string,
): Promise<{ totalDocs: number; docs: PostLite[] }> => {
  try {
    const res = await fetch(
      `/api/posts?depth=0&draft=true&limit=5&sort=-updatedAt&${where}`,
      { credentials: "include" },
    );
    if (!res.ok) return { totalDocs: 0, docs: [] };
    const json = await res.json();
    return { totalDocs: json.totalDocs ?? 0, docs: json.docs ?? [] };
  } catch {
    return { totalDocs: 0, docs: [] };
  }
};

const plural = (n: number, s: string, p?: string) => (n === 1 ? s : p ?? `${s}s`);

export const Notifications: React.FC = () => {
  const { user } = useAuth<User>();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const me = user.id;
    const isEditor = userIsEditor(user);
    let cancelled = false;

    (async () => {
      const out: Row[] = [];

      // Editor/admin — things to act on.
      if (isEditor) {
        const review = await fetchPosts(
          `where[workflowStatus][equals]=inReview&where[owner][not_equals]=${me}`,
        );
        if (review.totalDocs)
          out.push({
            key: "review",
            tone: "review",
            head: `${review.totalDocs} ${plural(review.totalDocs, "post")} waiting for your review`,
            items: review.docs,
          });

        const ready = await fetchPosts(`where[workflowStatus][equals]=approved`);
        if (ready.totalDocs)
          out.push({
            key: "ready",
            tone: "approved",
            head: `${ready.totalDocs} approved ${plural(ready.totalDocs, "post")} ready to publish`,
            items: ready.docs,
          });
      }

      // Everyone — changes requested on YOUR OWN posts (needs your attention).
      const changes = await fetchPosts(
        `where[owner][equals]=${me}&where[workflowStatus][equals]=changesRequested`,
      );
      if (changes.totalDocs)
        out.push({
          key: "changes",
          tone: "changes",
          head: `Changes requested on ${changes.totalDocs} of your ${plural(changes.totalDocs, "post")} — open to see the notes`,
          items: changes.docs,
        });

      // Authors — the status of your own posts (informational).
      if (!isEditor) {
        const mineReview = await fetchPosts(
          `where[owner][equals]=${me}&where[workflowStatus][equals]=inReview`,
        );
        if (mineReview.totalDocs)
          out.push({
            key: "mineReview",
            tone: "review",
            head: `${mineReview.totalDocs} of your ${plural(mineReview.totalDocs, "post")} ${plural(mineReview.totalDocs, "is", "are")} in review`,
            items: mineReview.docs,
          });

        const mineApproved = await fetchPosts(
          `where[owner][equals]=${me}&where[workflowStatus][equals]=approved`,
        );
        if (mineApproved.totalDocs)
          out.push({
            key: "mineApproved",
            tone: "approved",
            head: `${mineApproved.totalDocs} of your ${plural(mineApproved.totalDocs, "post")} ${plural(mineApproved.totalDocs, "is", "are")} approved, awaiting publishing`,
            items: mineApproved.docs,
          });
      }

      if (!cancelled) setRows(out);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || rows === null) return null; // not loaded yet

  return (
    <div className="sw-notif">
      <div className="sw-notif__title">Your review queue</div>
      {rows.length === 0 ? (
        <div className="sw-notif__ok">
          ✓ You&rsquo;re all caught up — nothing needs your attention.
        </div>
      ) : (
        rows.map((r) => (
          <div key={r.key} className={`sw-notif__row sw-tone-${r.tone}`}>
            <div className="sw-notif__head">{r.head}</div>
            {r.items.length > 0 && (
              <div className="sw-notif__links">
                {r.items.map((p) => (
                  <a key={String(p.id)} href={`/admin/collections/posts/${p.id}`}>
                    {p.title || `Post #${p.id}`}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;
