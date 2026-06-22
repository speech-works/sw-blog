import { APIError, type CollectionBeforeDeleteHook } from "payload";

// A media file can't be deleted while it's still referenced anywhere — otherwise the
// reference is silently nulled (the FKs are ON DELETE set null) and the live blog
// shows a broken image. This is a data-integrity rule with NO admin exemption.
// References checked: Posts.coverImage, Posts.audio (queryable), Posts.body in-text
// images (NOT queryable — we load all posts and walk the Lexical tree), and
// Users.photo (avatars, queryable).

type LexNode = {
  type?: string;
  value?: unknown; // upload node: a number id OR a populated { id }
  children?: LexNode[];
};

// Pull a media id out of an upload node's `value` (number id or populated { id }).
const uploadId = (v: unknown): number | undefined => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  }
  if (v && typeof v === "object") {
    const id = (v as { id?: unknown }).id;
    if (typeof id === "number") return id;
    if (typeof id === "string" && id.trim() !== "") {
      const n = Number(id);
      return Number.isNaN(n) ? undefined : n;
    }
  }
  return undefined;
};

// Walk a Lexical richtext value, collecting every in-text upload node's media id.
const collectBodyMediaIds = (body: unknown, into: Set<number>): void => {
  const visit = (node: LexNode | undefined): void => {
    if (!node || typeof node !== "object") return;
    if (node.type === "upload") {
      const id = uploadId(node.value);
      if (id != null) into.add(id);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) visit(child);
    }
  };
  const root = (body as { root?: LexNode } | null)?.root;
  if (root) visit(root);
};

// Cap a list to the first 5 names + "and N more".
const formatList = (items: string[]): string => {
  const head = items.slice(0, 5).map((t) => `"${t}"`);
  const more = items.length - head.length;
  return head.join(", ") + (more > 0 ? `, and ${more} more` : "");
};

export const protectMediaInUse: CollectionBeforeDeleteHook = async ({
  req,
  id,
}) => {
  const payload = req.payload;
  const mediaId = typeof id === "string" ? Number(id) : id;

  const titleOf = (p: { id: unknown; title?: unknown }): string =>
    typeof p.title === "string" && p.title.trim() ? p.title : `Post #${p.id}`;

  const postTitles = new Set<string>();

  // (a)+(b) cover image / audio — indexed equality queries. overrideAccess + draft so
  // the guard sees ALL posts (drafts included), not just the deleter's own published.
  const direct = await payload.find({
    collection: "posts",
    where: {
      or: [{ coverImage: { equals: mediaId } }, { audio: { equals: mediaId } }],
    },
    depth: 0,
    draft: true,
    pagination: false,
    overrideAccess: true,
  });
  for (const p of direct.docs) postTitles.add(titleOf(p as { id: unknown; title?: unknown }));

  // (d) in-text body images — not queryable; load all posts and walk each body.
  const all = await payload.find({
    collection: "posts",
    depth: 0,
    draft: true,
    pagination: false,
    overrideAccess: true,
  });
  for (const p of all.docs) {
    const ids = new Set<number>();
    collectBodyMediaIds((p as { body?: unknown }).body, ids);
    if (ids.has(mediaId as number)) {
      postTitles.add(titleOf(p as { id: unknown; title?: unknown }));
    }
  }

  // (c) avatars — Users.photo, indexed equality query.
  const users = await payload.find({
    collection: "users",
    where: { photo: { equals: mediaId } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  const profileNames = users.docs.map((u) => {
    const r = u as { id: unknown; name?: unknown };
    return typeof r.name === "string" && r.name.trim() ? r.name : `User #${r.id}`;
  });

  const titles = [...postTitles];
  if (titles.length === 0 && profileNames.length === 0) return; // not in use — allow

  const parts: string[] = [];
  if (titles.length) {
    parts.push(`${titles.length} post(s): ${formatList(titles)}`);
  }
  if (profileNames.length) {
    parts.push(`${profileNames.length} profile photo(s): ${formatList(profileNames)}`);
  }

  throw new APIError(
    `This file can't be deleted because it's still in use by ${parts.join("; ")}. ` +
      `Remove it from those first (or delete them), then delete this file.`,
    400,
  );
};
