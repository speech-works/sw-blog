# Speechworks Blog + Shared Chrome — Launch Checklist

Run top to bottom. Paths assume the three folders are siblings under
`~/Documents/speechworks-2/`. Use **Node 20** everywhere: `nvm use 20`.

Prereqs: `gh` CLI authenticated (or use the GitHub UI), and a GitHub **PAT (classic)**
with `read:packages` (+ `repo` if private) exported locally:

```bash
export NODE_AUTH_TOKEN=ghp_xxxxxxxxxxxxxxxx   # your PAT
```

---

## Phase 1 — Publish @speech-works/web-chrome (unblocks both deploys)

```bash
cd ~/Documents/speechworks-2/web-chrome
nvm use 20
git init && git add . && git commit -m "feat: shared Speechworks web chrome"
gh repo create speech-works/web-chrome --private --source=. --remote=origin --push
git tag v0.2.0 && git push origin v0.2.0     # triggers the publish workflow
```

- [ ] Confirm the **Publish to GitHub Packages** action went green (`gh run watch` or the Actions tab)
- [ ] 🖱️ In the package settings, grant the **sw-landing** and **sw-blog** repos read access
      (Package → Settings → Manage Actions access → Add repositories)

---

## Phase 2 — Point both apps at the published package

Create a committed `.npmrc` in each consuming app (token comes from the env, so this
is safe to commit), then install from the registry.

```bash
# --- sw-blog (the public site) ---
cd ~/Documents/speechworks-2/sw-blog/web
printf '@speech-works:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n' > .npmrc
npm install @speech-works/web-chrome@^0.2.0      # replaces the local tarball dep
npm run build                                    # sanity check

# --- sw-landing (the marketing site) ---
cd ~/Documents/speechworks-2/sw-landing
printf '@speech-works:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n' > .npmrc
npm install @speech-works/web-chrome@^0.2.0
npm run build
```

- [ ] Both builds pass with the registry dependency (no more `file:` tarball)

---

## Phase 3 — Sanity project (the blog's content backend)

```bash
cd ~/Documents/speechworks-2/sw-blog/studio
nvm use 20 && npm install
npx sanity login
npx sanity init --project-plan free     # create project + dataset "production" (public)
```

- [ ] Copy the **Project ID** it prints, then set env:

```bash
# studio env
printf 'SANITY_STUDIO_PROJECT_ID=<PROJECT_ID>\nSANITY_STUDIO_DATASET=production\nSANITY_STUDIO_HOST=speechworks-blog\n' > .env
npx sanity cors add http://localhost:3000 --no-credentials
npx sanity deploy                       # hosts the branded Studio at speechworks-blog.sanity.studio
```

```bash
# web env
cd ../web
cp .env.example .env.local
# then edit .env.local:
#   NEXT_PUBLIC_SANITY_PROJECT_ID=<PROJECT_ID>
#   SANITY_REVALIDATE_SECRET=<paste output of: openssl rand -hex 24>
```

- [ ] 🖱️ Invite SLP authors + the designated editor at sanity.io/manage
- [ ] Eyeball the Studio branding (deep-brown bar, white logo, orange accents)

---

## Phase 4 — Deploy the blog

```bash
cd ~/Documents/speechworks-2/sw-blog
git init && git add . && git commit -m "feat: Speechworks SLP blog (Next.js ISR + Sanity studio)"
gh repo create speech-works/sw-blog --private --source=. --remote=origin --push
```

Then 🖱️ in **Cloudflare Pages** (free), create a project from the `sw-blog` repo:

- Root directory: `web`
- Build command: `npx @opennextjs/cloudflare build` · Output: `.open-next` (per OpenNext docs)
- Env vars: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET=production`,
  `NEXT_PUBLIC_SITE_URL=https://speechworks.app`, `NEXT_PUBLIC_BASE_PATH=/blog`,
  `SANITY_REVALIDATE_SECRET=<same as web>`, and `NODE_AUTH_TOKEN=<the PAT>` (for the package)

- [ ] 🖱️ Sanity webhook (sanity.io/manage → API → Webhooks): URL
      `https://speechworks.app/blog/api/revalidate?secret=<SECRET>`, trigger on
      create/update/delete, filter `_type == "post"`
- [ ] 🖱️ Route `speechworks.app/blog/*` → the Pages app via Cloudflare
      (or use the `blog.speechworks.app` subdomain + set `NEXT_PUBLIC_BASE_PATH=` empty)
- [ ] End-to-end test: write a post → submit → approve → publish → it appears at
      `speechworks.app/blog/<slug>` with **no repo rebuild**

---

## Phase 5 — Finalize sw-landing

The marketing site's deploy (GitHub Actions → Pages) must auth to GitHub Packages.
Add `packages: read` permission and pass the token to install:

```yaml
# .github/workflows/deploy.yml  (edit)
    permissions:
      contents: write
      packages: read            # <-- add
    # ...
      - name: Install dependencies
        run: npm install
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}   # <-- add
```

(The committed `.npmrc` from Phase 2 handles the registry mapping.)

```bash
cd ~/Documents/speechworks-2/sw-landing
git add -A
git commit -m "feat(chrome): consume @speech-works/web-chrome; add Blog link; bump Next (CVE)"
```

- [ ] **Visual QA** the footer + mobile menu on the `feat/blog-nav-link` branch
- [ ] Merge to `main` **only after** `/blog` is live AND the package is published:

```bash
git checkout main && git merge feat/blog-nav-link && git push
```

---

## Optional

- [ ] Studio favicon (add `studio/static/favicon.ico`)
- [ ] Delete the stray `~/package-lock.json` (harmless build warning)

## Cut future chrome updates

```bash
cd ~/Documents/speechworks-2/web-chrome
# edit components, then:
npm version patch && git push --follow-tags      # publishes a new version
# in each app: npm install @speech-works/web-chrome@latest
```
