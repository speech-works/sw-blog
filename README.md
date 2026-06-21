# Speechworks Blog (`sw-blog`)

The blog for speechworks.app, where people who stutter and SLPs publish articles.
Authors write in a hosted **Sanity Studio v6** (WYSIWYG + draft/review/approve/publish,
plus side-by-side **visual-editing preview**); a separate **Next.js 16 app** serves the
public blog. Publishing a post refreshes the live site in seconds **without rebuilding
the landing site or this app**.

It is already deployed and live — this README explains how the pieces fit together
and how to work on them, not how to provision them from scratch.

| Piece | Lives at |
|-------|----------|
| Public blog (reader) | **https://blog.speechworks.app** |
| Author portal (Studio) | **https://speechworks-blog.sanity.studio** |
| Content database | Sanity project `po5f2sxg`, dataset `production` |

## How it's wired

```
Author (SLP / PWS) ── email login ──> Sanity Studio (hosted, FREE)
                                        WYSIWYG · draft → in review → approved → publish
                                              │ on publish/update/delete
                                              ▼  webhook (filter: _type == "post")
web/  Next.js ISR app on Netlify  ──>  POST /api/revalidate  → revalidatePath("/", "layout")
   /          blog index (ISR)         reads Sanity Content API (CDN)
   /[slug]    post (ISR, SEO HTML)
   served at blog.speechworks.app
```

Three moving parts:

1. **`studio/`** — the **author portal**. A Sanity Studio (React app) where authors
   write. It is the *only* place content is created/edited. Deployed to
   `speechworks-blog.sanity.studio`.
2. **`web/`** — the **reader**. A Next.js App Router app using ISR. It fetches
   published content from Sanity's CDN and renders SEO-friendly HTML. Deployed to
   Netlify, served at `blog.speechworks.app`.
3. **The content** lives in **Sanity's hosted dataset**, not in either repo. That is
   what decouples publishing from any build: an author publishing a post triggers a
   webhook that revalidates the cached pages — **no repo is rebuilt**.

The navbar/footer are not defined here — they come from the shared
[`@speech-works/web-chrome`](../web-chrome) package (also used by sw-landing) so the
two properties can't visually drift. See [Changing the shared chrome](#changing-the-shared-navbar--footer).

> **Publishing is gated to a designated editor allow-list** (see [Make someone an
> editor](#make-someone-an-editor-can-approve--publish)). The full access-control
> model, its trade-offs, and how to harden it are documented in the internal team
> runbook (gitignored) rather than in this public repo.

## Repo layout

| Folder    | What it is | Deploys to |
|-----------|------------|------------|
| `web/`    | Public Next.js ISR blog (the reader) | Netlify (`speechworks-blog`) |
| `studio/` | Sanity Studio: schema, approval workflow, the author portal | `speechworks-blog.sanity.studio` |

---

## Content model & authorship

Content lives in Sanity (project `po5f2sxg`, dataset `production`). Two document types:

- **`post`** — `title`, `slug`, `author` (ref), `coAuthors` (refs, optional),
  `peerReviewers` (refs to SLP authors, optional), `excerpt`, `coverImage`, `body`
  (Portable Text), `audioUrl` (optional narration), `tags`, `publishedAt`,
  `workflowStatus` (draft → in review → approved → published).
- **`author`** — `name`, `credentials`, `role` (Person who stutters / SLP / Parent /
  Researcher / Ally), `photo`, `bio`.

Together these power the blog's **trust layer**: a sticky author panel, role badges,
dual-voice (PWS + named SLP) bylines, "peer reviewed by" credits, reading time, and
optional audio narration. See [`web/src/app/[slug]/page.tsx`](web/src/app/[slug]/page.tsx)
and [`web/src/components/AuthorPanel.tsx`](web/src/components/AuthorPanel.tsx).

---

## Run it locally

> **Node 22+ required** (Sanity Studio v6 needs ≥22.12; Next.js 16 / React 19.2).
> A `.nvmrc` pinned to `22` sits at the repo root and in each package — run `nvm use`.

### Both at once (recommended)

From the **repo root**, one command runs `web` and `studio` together, picks free ports
automatically, and wires the visual-editing preview between them:

```bash
nvm use          # Node 22
npm run dev      # starts web + studio together (first time: install each app below)
```

It prints the URLs it chose, e.g.:

```text
  ● web     http://localhost:3005
  ● studio  http://localhost:3333   ← open this, then click "Presentation"
  (stop both with Ctrl+C)
```

If 3005 / 3333 are busy it grabs other free ports and **still wires preview correctly** —
each server is told the other's actual port at launch. The orchestrator is
[`scripts/dev.mjs`](scripts/dev.mjs) (plain Node, no extra dependencies).

### Or run each app on its own

**`web/` — the public blog**

```bash
cd web
cp .env.example .env.local      # first time only — values in the env table below
nvm use && npm install

npm run dev      # dev server (Turbopack)  ->  http://localhost:3000
npm run build    # production build (exactly what Netlify runs)
npm run start    # serve the production build locally (after `npm run build`)
npm run lint     # ESLint
```

**`studio/` — the author portal**

```bash
cd studio
cp .env.example .env            # first time only
nvm use && npm install

npm run dev      # local Studio  ->  http://localhost:3333
npm run build    # build the Studio bundle
npm run deploy   # publish the hosted Studio  ->  speechworks-blog.sanity.studio
```

Other Sanity CLI helpers from `studio/`: `npx sanity login` / `logout`,
`npx sanity manage` (open the project dashboard), `npx sanity dataset list`.

### Live preview (visual editing)

Editors can preview unpublished drafts in the real blog layout, side-by-side, with
click-to-edit — via the Studio's **Presentation** tool:

1. Create a Sanity **Viewer** token: `sanity.io/manage` → project → API → Tokens.
2. Put it in `web/.env.local` as `SANITY_API_READ_TOKEN=…` (server-only; never commit).
3. Run `npm run dev` from the root → open the **studio** URL → click **Presentation**.

Drafts are private, so the read token is required to render them (published content
works without it). In production, set the same token in the web host's env. Built on
`next-sanity` (Live Content API + visual editing) + Sanity's `presentationTool`.

---

## Making changes & deploying

### Change the public blog (`web/`)

Edit, commit, **push to `main`** → Netlify auto-deploys. Config is in
[`netlify.toml`](netlify.toml): base `web/`, command `npm run build`, runtime
`@netlify/plugin-nextjs`. Env vars live in the **Netlify dashboard** (Site
configuration → Environment variables), not in the repo. **Netlify must build on Node
22+** (Next 16 requires it) — `web/.nvmrc` (pinned to `22`) sets this automatically,
otherwise set `NODE_VERSION=22`. Manual deploy (optional, needs the Netlify CLI):
`cd web && netlify deploy --prod`.

### Change the author portal, schema, or approval logic (`studio/`)

Editing the Studio is **not** git-triggered. After changing anything under `studio/`
(schema in `schemaTypes/`, the workflow in `actions/`, the `EDITORS` list, config),
redeploy it manually:

```bash
cd studio && nvm use && npm run deploy
```

Until you redeploy, the hosted Studio at `speechworks-blog.sanity.studio` runs the
old bundle.

### Changing the shared navbar / footer

The chrome (Navbar, Footer, ContactModal, brand tokens) is **not** in this repo — it
lives in [`@speech-works/web-chrome`](../web-chrome), published to GitHub Packages and
consumed by both `web/` and sw-landing. To change it:

1. Edit `../web-chrome`, bump its version, and publish (see that package's README).
2. Bump the dependency in **both** `web/package.json` here **and** `sw-landing`, then
   redeploy each.

`web/src/components/SiteChrome.tsx` is the thin wrapper that feeds the blog's config
(links back to the marketing site, `activeItem: "blog"`, assets from the main origin)
into the package's components. `web/src/app/globals.css` imports the package's tokens
+ chrome CSS and has a `@source` line so Tailwind generates the chrome's classes.

> Installing `@speech-works/web-chrome` needs a GitHub token with `read:packages`
> exported as `NODE_AUTH_TOKEN` (see [`.npmrc`](web/.npmrc)). Locally that's your
> shell env; in sw-landing's GitHub Actions it's a `NODE_AUTH_TOKEN` repo secret.

### Publishing content (the common case — deploys nothing)

An author publishes in the Studio → the Sanity webhook calls `/api/revalidate` → the
blog cache is purged and the post is live within seconds. **No deploy of either app
is involved.** This is the entire point of the architecture.

---

## Common operational tasks

### Add a new author

Invite them as a member of the Sanity project (sanity.io/manage → Members, email
login). The Studio then shows them only **My posts / My profile** and only the
**Submit for review** action — they cannot Approve or Publish unless they're in the
editor allow-list below.

### Make someone an editor (can Approve + Publish)

Editors are an email allow-list provided via the `SANITY_STUDIO_EDITORS` env var
(comma-separated) — kept in `studio/.env` and the deploy environment, so emails stay
out of this public repo. Add the email (matching the address they sign into Sanity
with), then **redeploy the Studio** (`cd studio && npm run deploy`). If the var is
empty, nobody can publish.

### The approval workflow

1. **Author** writes a post, fills title/excerpt/cover/author, clicks **Submit for
   review** (status → in review). Publish stays disabled.
2. **Editor** opens the in-review queue, then **Approve** (or **Request changes** to
   send it back to draft). Approving unlocks **Publish**.
3. **Editor** publishes → webhook fires → post live at `blog.speechworks.app/<slug>`
   in seconds.

### Manually refresh the blog cache

If you ever need to force a revalidation without publishing:

```bash
curl -X POST -H "x-revalidate-secret: <SECRET>" https://blog.speechworks.app/api/revalidate
# -> {"revalidated":true}
```

### Sanity quota / plan

The project is on the **Free** plan (no card). If you see a "trial" banner, check the
**Plan** tab and confirm it downgrades to Free (rather than charging) when the trial
ends — that keeps the blog at $0.

---

## Reference

### Env vars

**`web/.env.local`** (and mirrored in Netlify's dashboard):

| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `po5f2sxg` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-10-01` |
| `NEXT_PUBLIC_SITE_URL` | `https://blog.speechworks.app` — this blog's own origin (canonical, OG, sitemap) |
| `NEXT_PUBLIC_MARKETING_URL` | `https://speechworks.app` — marketing site (chrome logo + nav back-links) |
| `NEXT_PUBLIC_BASE_PATH` | *(empty — served at the `blog.speechworks.app` subdomain root)* |
| `NEXT_PUBLIC_SANITY_STUDIO_URL` | Studio origin for visual-editing deep-links (prod: `https://speechworks-blog.sanity.studio`) |
| `SANITY_REVALIDATE_SECRET` | shared webhook secret — must match Netlify's value and the Sanity webhook |
| `SANITY_API_READ_TOKEN` | **server-only** Sanity Viewer token — renders drafts for visual-editing preview (never commit) |

**`studio/.env`**: `SANITY_STUDIO_PROJECT_ID=po5f2sxg`,
`SANITY_STUDIO_DATASET=production`, `SANITY_STUDIO_HOST=speechworks-blog`,
`SANITY_STUDIO_EDITORS=<comma-separated editor emails>`, and
`SANITY_STUDIO_PREVIEW_URL` (the blog origin the Presentation tool previews against;
the root `npm run dev` sets this automatically for local dev).

### The publish webhook (Sanity → blog)

Configured in sanity.io/manage → project → API → Webhooks:

- **URL:** `https://blog.speechworks.app/api/revalidate`
- **Method:** POST · **Header:** `x-revalidate-secret: <SANITY_REVALIDATE_SECRET>`
  (alternatively `?secret=...` on the URL — the endpoint accepts either)
- **Trigger on:** Create, Update, Delete · **Filter:** `_type == "post"` · **Drafts:** off

The endpoint is [`web/src/app/api/revalidate/route.ts`](web/src/app/api/revalidate/route.ts):
it checks the secret against `SANITY_REVALIDATE_SECRET` and runs
`revalidatePath("/", "layout")`.

### Where the secrets live (never in git)

| Secret | Used for | Stored in |
|--------|----------|-----------|
| `SANITY_REVALIDATE_SECRET` | webhook auth | Netlify env vars · the Sanity webhook · local `web/.env.local` |
| `NODE_AUTH_TOKEN` (GitHub PAT, `read:packages`) | installing `@speech-works/web-chrome` | your shell · sw-landing's GitHub Actions repo secret |

### DNS

`blog.speechworks.app` is a **CNAME** (managed at GoDaddy) → `speechworks-blog.netlify.app`.
Netlify provisions the Let's Encrypt cert automatically.

### Recreating from scratch

You won't normally need to (it's all live). The full provisioning steps — creating the
Sanity project, the Netlify site, DNS, and the webhook — live in the team runbook (see
below), as a disaster-recovery reference.

## Internal docs (not committed)

Operational guides — the **author guide** (for SLP/PWS authors) and the **team
runbook** (provisioning, enable/disable authors, the access-control model + free-tier
limits, troubleshooting) — are kept locally in the maintainer's working copy (under a
gitignored `docs/` folder), not committed to this repo. Ask the `sw-blog` maintainer.
