# Speechworks Blog (`sw-blog`)

The blog for speechworks.app — one place where people who stutter/stammer and SLPs
publish articles together. It's **one Next.js 16 app** with **Payload CMS** built in:
authors log in at `/admin`, and the same app serves the public blog.

| Piece | Lives at |
|-------|----------|
| Public blog | **https://blog.speechworks.app** |
| Author/editor portal | **https://blog.speechworks.app/admin** |
| Database (text + content) | **Neon** Postgres (serverless, free tier) |
| Media (images + audio) | **Cloudflare R2** (S3-compatible, free tier) |
| Hosting | **Netlify** (`@netlify/plugin-nextjs`) |

## Architecture

```
Author ── login ──> /admin (Payload, inside the same Next.js app)
                      WYSIWYG · draft → in review → approved → publish
                            │ on publish/change (server hook)
                            ▼  revalidatePath() in-process — no webhook needed
Next.js app on Netlify
  /             blog index     reads Payload via the Local API (no HTTP hop)
  /[slug]       post page      published only; drafts visible only in preview
  /admin        Payload admin + REST/GraphQL API
  served at blog.speechworks.app
```

Everything is one deployable. Payload mounts `/admin` + its REST/GraphQL API inside
the Next app; public pages read content via Payload's in-process Local API (no extra
HTTP call). Text lives in Neon; images/audio live in R2. The navbar/footer come from
the shared [`@speech-works/web-chrome`](../web-chrome) package so the blog and the
marketing site can't visually drift.

## Why this setup

Payload is MIT-licensed (free forever, no per-seat fees) and enforces permissions on
the **server, every request** — so "an author can only touch their own drafts" and
"only an editor can publish" are real server rules, not UI hints. Text content is
cheap on Neon's free tier; R2's free tier (10 GB, zero egress fees) handles all
images and audio.

## Repo layout

```
web/                        the app (deploys to Netlify)
  payload.config.ts         master config (db, storage, editor, collections, admin branding)
  src/
    collections/            Users · Posts · Media
    access/                 role helpers (isAdmin / isEditor / …)
    hooks/                  owner stamp · workflow gate · revalidate · discoverability · co-author gate
    migrations/             Payload DB migrations (committed; Netlify runs them on deploy)
    components/admin/       workflow buttons · gated publish · avatar · logo · discoverability control
    components/             RichText (Lexical→React) · PostArticle · LivePostArticle · PreviewBanner · …
    app/(payload)/          /admin + REST/GraphQL
    app/(frontend)/         public site + /next/preview + /next/exit-preview
    lib/                    payload (Local API) · queries · adapt · media · format · roles · types · env
```

## Roles & the approval workflow

Roles live on the `users` collection: **admin · editor · author · reviewer**.
Only an admin can change them; the first account ever created becomes admin automatically.

| Role | What they can do |
|------|-----------------|
| **Author** | Write and edit their own posts (draft + changes-requested only); submit for review; can't publish |
| **Editor** | See and edit everything; approve, request changes, publish/unpublish |
| **Reviewer** | Optional SLP peer-reviewer (shown in the "peer reviewed by" byline) |
| **Admin** | Everything; manage users and roles |

A post moves through: **draft → in review → (changes requested ↔ draft) → approved → published**.

The **Submit / Approve / Request changes** buttons in `/admin` drive it; the server-side
`workflowGate` hook is the real enforcement — it can't be bypassed via the API.

## Content model

- **`users`** — login + public author profile: `name`, `credentials`, `contributorType`
  (PWS / SLP / Parent / Researcher / Ally → the public badge), `photo`, `bio`, `roles`.
  Includes time-boxed **discoverability** so authors can be found as co-authors without
  permanently exposing their profile to other users (Hidden / 1h / 8h / Always).

- **`posts`** — `title`, `slug` (auto-generated), `author`, `coAuthors`, `peerReviewers`
  (SLPs only), `excerpt`, `coverImage`, `body` (Lexical rich text with in-text images
  sized Small/Medium/Full), `audio` (upload) or `audioUrl`, `tags`, `publishedAt`,
  `workflowStatus`, system-only owner + audit stamps (who submitted/approved/published + when).

- **`media`** — images + audio (R2 in production, local disk in dev). Images are
  auto-resized to: `card` (800×480), `cover` (1200w), `og` (1200×630), `small` (800w),
  `medium` (1100w), `full` (1400w), `avatar` (160×160).

These power the trust layer: sticky author panel, role badges, dual-voice bylines,
"peer reviewed by" credits, reading time, and audio narration.

## Run it locally

> **Node 22** required. `.nvmrc` is pinned — run `nvm use` inside `web/`.

```bash
cd web
cp .env.example .env.local   # first time — fill in DATABASE_URI + PAYLOAD_SECRET
nvm use && npm install

npm run dev              # → http://localhost:3000  (/admin at /admin)
npm run build            # production build (what Netlify runs)
npm run generate:types   # regenerate src/payload-types.ts after schema changes
```

From the repo root, `npm run dev` / `npm run build` delegate to `web/`.

**Minimum to boot:** a Neon database. Set `DATABASE_URI` (pooled connection string,
host contains `-pooler`) and a random `PAYLOAD_SECRET` in `web/.env.local`.
R2 is not needed locally — uploads fall back to local disk.

The dev server uses Payload's schema-push mode (no migration file needed). On first
boot it creates the tables; on first visit to `/admin` you create the admin account.

### Preview & live editing

Open a post in `/admin` → **Live Preview** for a side-by-side editor + preview that
updates **as you type** (client-side via `useLivePreview` — no DB hit per keystroke).
The **eye icon** opens the draft in a new tab instead.

Preview is gated by the **logged-in Payload session** — there is no secret in the
URL. Anonymous requests to `/next/preview` return 401. Authors can only preview their
own drafts; editors can preview any.

## Deploying (Netlify)

Push to `main` → Netlify auto-deploys. Config in [`netlify.toml`](netlify.toml):
base `web/`, Node 22, `@netlify/plugin-nextjs`, and the build command runs
**DB migrations before the build** (`payload migrate && next build`).

Migrations are committed TypeScript files in `src/migrations/` — the build step
applies any that are pending against the production Neon DB, then the Next build runs.

### Required Netlify environment variables

Set these in the **Netlify dashboard** → Site configuration → Environment variables.

| Variable | What it is |
|----------|------------|
| `DATABASE_URI` | Neon **pooled** connection string (`-pooler` in host, `?sslmode=require` suffix) |
| `PAYLOAD_SECRET` | Master key Payload uses to sign login sessions (long random hex string) |
| `R2_BUCKET` | Cloudflare R2 bucket name |
| `R2_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `SMTP_HOST` | Brevo SMTP host — `smtp-relay.brevo.com` |
| `SMTP_PORT` | Brevo SMTP port — `587` |
| `SMTP_USER` | Brevo SMTP login |
| `SMTP_PASS` | Brevo SMTP key/password |
| `EMAIL_FROM_ADDRESS` | Password reset sender — `no-reply@speechworks.app` |
| `EMAIL_FROM_NAME` | Password reset sender name — `Speechworks Blog` |
| `NODE_AUTH_TOKEN` | GitHub PAT (`read:packages`) to install `@speech-works/web-chrome` |
| `NEXT_PUBLIC_SITE_URL` | This blog's origin — `https://blog.speechworks.app` |
| `NEXT_PUBLIC_MARKETING_URL` | Marketing site origin — `https://speechworks.app` |
| `NEXT_PUBLIC_BASE_PATH` | Leave empty (blog is at the domain root) |

> No `PREVIEW_SECRET` needed — draft preview is gated by the logged-in Payload session.

### First production deploy

1. Netlify runs `payload migrate` → creates empty tables in the prod Neon DB.
2. Next build completes and the site deploys.
3. Open `https://blog.speechworks.app/admin` → create the first account (becomes admin automatically).
4. Add author/editor accounts from within `/admin` → Users.

## Common tasks

**Add a user:** admin creates them in `/admin` → Users, sets their role.

**Approval flow:** author clicks **Submit for review** → editor **Approves** (or clicks
**Request changes** and adds a note) → editor clicks **Publish** → public page
revalidates within seconds.

**Co-authoring:** an author opens their profile and sets their discoverability window
(Hidden / 1h / 8h / Always). While discoverable, others can pick them as a co-author.
The server hard-blocks adding non-discoverable users as co-authors (editors are exempt).

**Schema changes:** edit a collection, run `npm run generate:types`, then
`npm run payload -- migrate:create --name <description>` to generate a migration file,
commit it with the schema change, and push. Netlify applies it on the next deploy.

## Shared navbar / footer

The chrome lives in [`@speech-works/web-chrome`](../web-chrome) (GitHub Packages),
consumed by both `web/` and sw-landing. Edit + publish that package, bump the dep in
both consumers, redeploy. `web/src/components/SiteChrome.tsx` wraps it; `globals.css`
imports its tokens + a `@source` line for Tailwind. Installing needs a GitHub PAT with
`read:packages` as `NODE_AUTH_TOKEN`.

## DNS

`blog.speechworks.app` → CNAME (GoDaddy) → `speechworks-blog.netlify.app`

## Internal docs

Operational guides (author onboarding, team runbook, known limitations) live in a
gitignored `docs/` folder in the maintainer's working copy, not in this public repo.
