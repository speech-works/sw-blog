# Speechworks Blog (`sw-blog`)

The blog for speechworks.app, where people who stutter and SLPs publish articles.
It's **one Next.js 16 app** with **Payload CMS** built in: authors log in and write at
`/admin`, and the same app serves the public blog. Publishing a post refreshes the
live page in seconds (in-process revalidation) — no rebuild.

| Piece | Lives at |
|-------|----------|
| Public blog (reader) | **https://blog.speechworks.app** |
| Author portal (admin) | **https://blog.speechworks.app/admin** |
| Database (text/content) | **Neon** Postgres (serverless) |
| Media (images + audio) | **Cloudflare R2** (S3-compatible) |
| Hosting | **Netlify** (`@netlify/plugin-nextjs`) |

## How it's wired

```
Author (SLP / PWS) ── login ──> /admin (Payload, in the same app)
                                  WYSIWYG · draft → in review → approved → publish
                                        │ on change (server hook)
                                        ▼  revalidatePath() in-process — no webhook
Next.js app on Netlify
   /          blog index            reads Payload via the Local API (no HTTP hop)
   /[slug]    post (SEO HTML)        published only; drafts shown only in preview
   /admin     Payload admin + REST/GraphQL
   served at blog.speechworks.app
```

Everything is one deployable. Payload mounts `/admin` + its API inside the Next app;
the public pages read content through Payload's in-process Local API. Text lives in
Neon; images/audio live in R2. The navbar/footer come from the shared
[`@speech-works/web-chrome`](../web-chrome) package (also used by sw-landing) so the
two properties can't visually drift.

## Why this setup

Payload is free + open-source and enforces permissions on the **server, every
request** (admin, REST, GraphQL, Local API) — so "an author only touches their own
drafts" and "only an editor can publish" are real rules, not UI-only suggestions.

## Repo layout

| Folder | What it is |
|--------|------------|
| `web/` | The whole app — public blog **and** the Payload admin/API (deploys to Netlify) |

```
web/
  payload.config.ts        master config (db, storage, editor, collections, admin)
  src/
    collections/  Users · Posts · Media
    access/       role helpers (isAdmin/isEditor/…)
    hooks/        owner stamp · workflow gate · revalidate · discoverability · co-author gate
    components/admin/  workflow buttons · gated publish · avatar · logo · discoverability control
    components/   RichText (Lexical→React) · PostArticle · LivePostArticle · AuthorPanel · …
    app/(payload)/     /admin + REST/GraphQL
    app/(frontend)/    the public site (+ /next/preview, /next/exit-preview)
    lib/          payload (Local API) · queries · adapt · media · format · roles · types · env
```

## Roles & the approval workflow

Permission roles live on the `users` collection: **admin · editor · author · reviewer**
(only an admin can change them; the first account created becomes admin).

- **Author** — writes their *own* posts (read/edit only their own, only while draft or
  changes-requested); can't publish.
- **Editor** — reviews everything; the only role that can publish.
- **Reviewer** — optional SLP peer-reviewer.

A post moves: **draft → in review → (changes requested) → approved → published**
(`_status`). The friendly **Submit / Approve / Request changes** buttons + a gated
**Publish** drive it; the server `workflowGate` hook is the real enforcement.

## Content model

- **`users`** — login + public byline: `name`, `credentials`, `contributorType`
  (PWS / SLP / Parent / Researcher / Ally → the public badge), `photo`, `bio`,
  `roles`, time-boxed **discoverability** (so authors can be found as co-authors).
- **`posts`** — `title`, `slug`, `author`, `coAuthors`, `peerReviewers` (SLPs),
  `excerpt`, `coverImage`, `body` (Lexical rich text incl. in-text images sized
  Small/Medium/Full), `audio` (upload) or `audioUrl`, `tags`, `publishedAt`,
  `workflowStatus`, owner + audit stamps.
- **`media`** — images + audio uploads (R2 in prod, local disk in dev), with
  auto-generated responsive image sizes.

These power the trust layer: sticky author panel, role badges, dual-voice bylines,
"peer reviewed by" credits, reading time, and audio narration.

## Run it locally

> **Node 22+** (`.nvmrc` is pinned to `22` — run `nvm use`).

```bash
cd web
cp .env.example .env.local      # first time — fill in DATABASE_URI + PAYLOAD_SECRET (see below)
nvm use && npm install

npm run dev          # http://localhost:3000  (admin at /admin)
npm run build        # production build (what Netlify runs)
npm run generate:types   # regenerate src/payload-types.ts after schema changes
```

(From the repo root, `npm run dev` / `npm run build` just delegate into `web/`.)

The **only requirement to boot** is a Neon database — set `DATABASE_URI` (pooled
connection string) and `PAYLOAD_SECRET` in `web/.env.local`. R2 is optional locally
(uploads fall back to local disk). On first run the first visitor to `/admin` creates
the admin account.

### Live preview

Open a post in `/admin` and click **Live Preview** (top of the document) for the
side-by-side editor + preview — it updates **as you type** (client-side, no DB hit).
The **eye / Preview** button opens the draft in a new tab instead. Drafts are private;
the public site only shows published posts.

## Deploying (Netlify)

Push to `main` → Netlify auto-deploys. Config in [`netlify.toml`](netlify.toml): base
`web/`, command `npm run build`, `@netlify/plugin-nextjs`, Node 22 (via `web/.nvmrc`).

Production needs these env vars set in the **Netlify dashboard** (the build succeeds
without them but the site renders empty + `/admin` won't work):

| Var | What |
|-----|------|
| `DATABASE_URI` | Neon **pooled** connection string |
| `PAYLOAD_SECRET` | random master key (different from local) |
| `PREVIEW_SECRET` | guards the draft-preview link |
| `R2_BUCKET` / `R2_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2 media |
| `NODE_AUTH_TOKEN` | GitHub PAT (`read:packages`) to install `@speech-works/web-chrome` |
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_MARKETING_URL` | site + marketing origins |

> Production uses Payload **migrations** (not the dev auto-push). Generate them with
> `npm run payload migrate:create` and run `npm run payload migrate` in the release step.

## Common tasks

- **Add an author/editor:** an admin creates the user in `/admin` (Users) and sets
  their `roles`. The first-ever account is auto-admin.
- **Approval flow:** author **Submit for review** → editor **Approve** (or **Request
  changes** with a note) → editor **Publish** → the public page revalidates in seconds.
- **Co-authoring:** an author makes themselves **discoverable** (Hidden / 1h / 8h /
  Always) on their profile; others can then pick them as a co-author during that window.

## Changing the shared navbar / footer

The chrome lives in [`@speech-works/web-chrome`](../web-chrome) (GitHub Packages),
consumed by both `web/` and sw-landing. Edit + publish that package, bump the dep in
both consumers, redeploy. `web/src/components/SiteChrome.tsx` wraps it; `globals.css`
imports its tokens + a `@source` line for Tailwind. Installing it needs a GitHub PAT
with `read:packages` as `NODE_AUTH_TOKEN`.

## DNS

`blog.speechworks.app` is a **CNAME** (GoDaddy) → `speechworks-blog.netlify.app`.

## Internal docs (not committed)

Operational guides (author guide, team runbook, known-limitations) live in a gitignored
`docs/` folder in the maintainer's working copy, not in this public repo.
