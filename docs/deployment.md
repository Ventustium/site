# Deployment and caching

## Commands

Requires Node.js 22.23 or newer.

```bash
npm install
npm run dev       # Astro dev server on http://localhost:4321
npm run check     # type check, including missing translations
npm run build     # static output in dist/
npm run preview   # build, then serve dist/ with the Cloudflare runtime on http://localhost:8787
npm run deploy    # build and deploy (run `npx wrangler login` once first)
```

## Cloudflare setup

`wrangler.jsonc` deploys `dist/` as Workers static assets with no Worker script:

- `assets.directory` is `./dist`.
- `not_found_handling: "404-page"` serves `dist/404.html` for unknown paths.
- `/id` redirects to `/id/` (Cloudflare's default trailing-slash handling).

Cloudflare applies two files from `public/`:

- `_redirects`: `/wallet` → `/#wallet` and `/id/wallet` → `/id/#wallet` (301).
- `_headers`: the security and cache headers below.

`npm run dev` ignores both files. Use `npm run preview` to test them.

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

   Expect `200`, `200`, `301` and `404`.
4. For visual checks, take a headless screenshot. `--force-prefers-reduced-motion` keeps the screenshot from catching the scenes mid-animation:

   ```bash
   chromium --headless=new --hide-scrollbars --force-prefers-reduced-motion \
     --window-size=1440,900 --virtual-time-budget=8000 \
     --screenshot=out.png "http://localhost:8787/id/#wallet"
   ```
