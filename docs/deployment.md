# Deployment and caching

## Commands

Requires Node.js 22.23 or newer.

```bash
npm install
npm run dev       # Astro dev server on http://localhost:4321
npm run check     # type check, including missing translations
npm run build     # static output in dist/
npm run preview     # build, then serve dist/ with the Cloudflare runtime on http://localhost:8787
npm run deploy      # build and deploy to production, ventustium.com (run `npx wrangler login` once first)
npm run deploy:dev  # build and deploy to staging, the separate "site-dev" Worker
npm run upload      # build and upload a preview version of production without making it live
```

## Branches: develop without touching production

Production is the `main` branch. Work happens on `dev` (or any other branch) and reaches `ventustium.com` only when it is merged into `main`.

```bash
git switch dev          # or: git switch -c my-feature
# ... edit, npm run check, npm run preview, commit ...
git push                # builds the branch, never production
# when it looks right:
git switch main && git merge dev && git push   # deploys ventustium.com
```

### Workers Builds settings (dashboard)

Worker `site` → **Settings** → **Build**:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command (production branch) | `npx wrangler deploy --env=""` |
| Production branch | `main` |
| Builds for non-production branches | on |
| Non-production branch deploy command | `npx wrangler deploy --env dev` |
| Environment variable | `NODE_VERSION` = `22` (Astro needs 22.23 or newer) |

With these settings a push to `main` deploys production, and a push to any other branch deploys the staging Worker `site-dev` at `https://dev-ui.ventustium.com` (also `https://site-dev.<account subdomain>.workers.dev`). Every non-production branch shares that one staging Worker, so the last push wins.

If you would rather get one preview URL per branch, leave the non-production deploy command at its default, `npx wrangler versions upload`. It uploads a version of the production Worker without making it live, and its preview URL is shown on the build and in the GitHub status (`preview_urls` is on in `wrangler.jsonc`).

### Environments in wrangler.jsonc

| | Production (top level) | Staging (`env.dev`) |
| --- | --- | --- |
| Worker | `site` | `site-dev` |
| URLs | `ventustium.com`, `www.ventustium.com`, workers.dev | `dev-ui.ventustium.com`, workers.dev |
| Deploy | `npm run deploy` or a push to `main` | `npm run deploy:dev` or a push to another branch |

`env.dev` repeats `assets`, `routes` (only `dev-ui.ventustium.com`) and `workers_dev` on purpose, so it never inherits the production custom domains. Wrangler creates the `dev-ui` DNS record and certificate on the first staging deploy. Because `wrangler.jsonc` has more than one environment, production commands pass `--env=""` to target the top level explicitly; without it Wrangler warns.

Preview and staging URLs are public to anyone who has the link. Put them behind Cloudflare Access if they must stay private.

## Cloudflare setup

`wrangler.jsonc` deploys `dist/` as Workers static assets with no Worker script:

- `name` is `site`, the name of the Worker in the Cloudflare dashboard. Changing it makes `wrangler deploy` create a separate Worker.
- `assets.directory` is `./dist`.
- `not_found_handling: "404-page"` serves `dist/404.html` for unknown paths.
- `routes` lists the custom domains `ventustium.com` and `www.ventustium.com`. `workers_dev`, `preview_urls` and `observability` match the dashboard settings.

`wrangler.jsonc` must match the dashboard. A setting that exists only in the dashboard can be overwritten by the next deploy. For example, a custom domain missing from `routes` is detached. After changing a Worker setting in the dashboard, copy it into `wrangler.jsonc`.

The WAF rule that blocks vulnerability scanners is set in the dashboard, not here. See [security.md](security.md).

Cloudflare applies two files in `dist/`:

- `_headers`, copied from `public/`: the security and cache headers below.
- `_redirects`, **generated** after each build by the `cloudflare-redirects` integration in `astro.config.mjs`, from `LANGUAGES` in `src/config.ts`. It always has `/wallet` → `/#wallet` (301). A published language gets `/<locale>/wallet` → `/<locale>/#wallet` (301). A hidden language gets `/<locale>` and `/<locale>/*` → `/` (302, since it may come back). Do not add a `public/_redirects`.

`npm run dev` ignores both files. Astro's `redirects` option in `astro.config.mjs` mirrors the hidden-language redirect so `/id/` behaves the same in dev. Use `npm run preview` to test the real files.

## Caching

| Path | Cache-Control | Why |
| --- | --- | --- |
| HTML | `public, max-age=0, must-revalidate` (Cloudflare default) | a deploy shows up immediately |
| `/_astro/*` | `public, max-age=31536000, immutable` | filenames contain a content hash |
| `/assets/*` | `public, max-age=604800` (7 days) | filenames are not hashed |

Files in `public/assets/` keep their names, so browsers may keep an old copy for up to 7 days. When you change one, rename it or add a `?v=` query where it is referenced.

Fonts are referenced by absolute `/assets/fonts/...` URLs in two places: `home.css` and the `<link rel="preload">` tags in `Base.astro`. Keep them in sync.

## Verifying a change

There are no automated tests. Before deploying:

1. `npm run check` reports 0 errors.
2. `npm run build` succeeds.
3. With `npm run preview` running, check the routes:

   ```bash
   for p in / /id/ /wallet /does-not-exist; do
     curl -s -o /dev/null -w "%{http_code} $p\n" "http://localhost:8787$p"
   done
   ```

   Expect `200`, `302` (Indonesian off; `200` when on), `301` and `404`.
4. For visual checks, take a headless screenshot. `--force-prefers-reduced-motion` keeps the screenshot from catching the scenes mid-animation:

   ```bash
   chromium --headless=new --hide-scrollbars --force-prefers-reduced-motion \
     --window-size=1440,900 --virtual-time-budget=8000 \
     --screenshot=out.png "http://localhost:8787/#wallet"
   ```
