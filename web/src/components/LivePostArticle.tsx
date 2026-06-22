"use client";
import { useLivePreview } from "@payloadcms/live-preview-react";
import type { Post as PayloadPost } from "@/payload-types";
import { toPost } from "@/lib/adapt";
import PostArticle from "@/components/PostArticle";

// Realtime preview: subscribes to the editor's live content (postMessage) and
// re-renders the article as you type — no save, no database query per change.
export default function LivePostArticle({
  initialDoc,
}: {
  initialDoc: PayloadPost;
}) {
  const { data } = useLivePreview<PayloadPost>({
    initialData: initialDoc,
    serverURL: typeof window !== "undefined" ? window.location.origin : "",
    depth: 2,
  });
  return <PostArticle post={toPost(data)} />;
}
