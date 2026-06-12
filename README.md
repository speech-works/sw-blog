# Speechworks Blog (`sw-blog`)

The SLP blog for speechworks.app. Authors write in a hosted **Sanity Studio**
(WYSIWYG + draft/review/approve/publish), and a separate **Next.js ISR app** serves
the public blog at `speechworks.app/blog`. Publishing updates Sanity and refreshes
the app in seconds **without rebuilding the landing site or this app**.

```
Author (SLP) ── email login ──> Sanity Studio (hosted, FREE, zero-ops)
                                  WYSIWYG · draft → in review → approved → publish
                                        │ on publish (webhook)
                                        ▼
Next.js ISR app (web/)  ──>  /api/revalidate  → revalidates blog routes
   /          blog index (ISR)        reads Sanity Content API (CDN)
   /[slug]    post (ISR, SEO HTML)
   deployed FREE on Cloudflare Pages, mounted at speechworks.app/blog
```

## Repo layout

| Folder    | What it is | Deploys to |
|-----------|------------|------------|
| `web/`    | Public Next.js ISR blog (the reader) | Cloudflare Pages (free) |
| `studio/` | Sanity Studio (the author portal + schema + approval workflow) | `<name>.sanity.studio` (free) |

The content itself lives in **Sanity's hosted dataset**, not in either repo. That is
what decouples publishing from any build.

> **Approval is soft.** Sanity's free tier has only admin/viewer roles, so the
> "authors can't publish" gate is enforced by document state + convention (a
> designated publisher), not by hard per-user permissions. Accepted trade-off for
> zero cost / zero ops. To harden later: paid Sanity custom roles, or a self-hosted
> CMS (Ghost/Directus).

## Prerequisites

- Node 20+ (`nvm use 20`). Node 16 will not work.
- A free Sanity account (sanity.io) and a Cloudflare account.

---

## Step 1 — Create the Sanity project

1. Go to [sanity.io/manage](https://www.sanity.io/manage) → create a project.
2. Note the **Project ID**. Create a dataset named `production` (public read).
3. Invite your SLP authors and the designated editor as project members (email
   login). On the free plan they are all "Administrator"; the approval gate below
   is what structures who publishes.

## Step 2 — The author portal (`studio/`)

```bash
cd studio
cp .env.example .env            # set SANITY_STUDIO_PROJECT_ID + SANITY_STUDIO_HOST
nvm use 20 && npm install
npm run dev                     # http://localhost:3333 to try it locally
npm run deploy                  # hosts the portal free at <host>.sanity.studio
```

Share the `<host>.sanity.studio` URL with authors. This is the WYSIWYG portal with
the draft → in review → approved → publish workflow.

## Step 3 — The public blog (`web/`)

```bash
cd web
cp .env.example .env.local      # set NEXT_PUBLIC_SANITY_PROJECT_ID, SECRET, etc.
nvm use 20 && npm install
npm run dev                     # http://localhost:3000  (or /blog if BASE_PATH set)
npm run build                   # production build
```

Key env (`web/.env.local`):

| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | from Step 1 |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://speechworks.app` |
| `NEXT_PUBLIC_BASE_PATH` | `/blog` for path routing, empty for subdomain |
| `SANITY_REVALIDATE_SECRET` | any long random string (also used in Step 5) |

## Step 4 — Deploy the blog (Cloudflare Pages, free + commercial-OK)

The blog uses Next.js ISR, so it needs a server-capable host (not GitHub Pages).
Cloudflare is recommended because it also fronts the domain for `/blog` routing.

1. Push this repo to GitHub.
2. Build `web/` for Cloudflare with the OpenNext adapter
   ([`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)) and deploy to
   Cloudflare Pages. Set the same env vars as Step 3 in the Pages project.
3. (Alternatives if you prefer: **Netlify** free tier has first-class Next.js ISR
   support; **Vercel** is simplest but its free Hobby tier is non-commercial, so a
   company needs Vercel Pro.)

## Step 5 — Wire the publish webhook (instant updates)

In [sanity.io/manage](https://www.sanity.io/manage) → API → Webhooks → Create:

- **URL:** `https://speechworks.app/blog/api/revalidate?secret=YOUR_SECRET`
  (subdomain fallback: `https://blog.speechworks.app/api/revalidate?secret=...`)
- **Trigger on:** Create, Update, Delete
- **Filter:** `_type == "post"`
- **Secret:** the same `SANITY_REVALIDATE_SECRET` value

Now a publish purges the blog cache and the post appears in seconds — no rebuilds.

## Step 6 — Route speechworks.app/blog → this app

Same-domain `/blog` needs Cloudflare in front of the apex domain:

1. Put `speechworks.app` on Cloudflare (nameservers).
2. Add a rule/Worker so `speechworks.app/blog*` proxies to the Cloudflare Pages
   deployment (forward the path **without** stripping `/blog`, matching
   `NEXT_PUBLIC_BASE_PATH=/blog`). Everything else continues to GitHub Pages.

**Don't want to move DNS?** Use the **subdomain fallback**: deploy with
`NEXT_PUBLIC_BASE_PATH` empty and point a `blog.speechworks.app` CNAME at the app.
No proxy needed.

## Step 7 — Turn on the link in the landing site

In `sw-landing`, the `feat/blog-nav-link` branch adds the "Blog" nav/footer links.
**Merge it only after `/blog` is live** so the link never 404s.

---

## Day-to-day workflow (authors + editor)

1. **Author** opens the Studio, writes a post, fills title/excerpt/cover/author,
   then clicks **Submit for review** (status → in review). The Publish button stays
   disabled.
2. **Editor** opens "Posts by status → In review", reviews, and clicks **Approve**
   (or **Request changes** to send it back). Once approved, **Publish** unlocks.
3. **Editor** publishes. The webhook fires and the post is live at
   `speechworks.app/blog/<slug>` within seconds.

## Documentation

Operational guides — the **author guide** (for SLP/PWS authors) and the **team
runbook** (enable/disable authors, make editors, approve/publish, the access-control
model + free-tier limits, troubleshooting) — are kept **internally** in the
maintainer's working copy (under a gitignored `docs/` folder), not committed to this
public repo. Ask the `sw-blog` maintainer for them.

## Keeping the look in sync (no layout shift)

The shared chrome (Navbar, Footer, ContactModal, brand tokens) lives in **one
package**, [`@speech-works/web-chrome`](../web-chrome), consumed by both this repo and
sw-landing — so they can't drift and there's no layout shift between properties.

- `web/src/components/SiteChrome.tsx` is a thin `"use client"` wrapper that fills in
  the blog's config (links to the marketing site, `activeItem: "blog"`, assets from
  the main origin) and renders the package's `Navbar`/`Footer`.
- `web/src/app/globals.css` imports the package's tokens + chrome CSS and adds a
  `@source` line so Tailwind generates the classes the chrome uses.

Change the navbar/footer **once** in `@speech-works/web-chrome`, publish a new
version, and bump it here + in sw-landing. See that package's README for the publish
and GitHub Packages auth runbook.
