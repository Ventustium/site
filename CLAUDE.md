# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The ventustium.com profile site: one page, built with Astro as static HTML and served as static assets on Cloudflare Workers. English is at `/`. An Indonesian translation exists at `/id/` but is switched off in `src/config.ts`. There is no server code, database, or Worker script.

The repo is public as a portfolio piece but is **All Rights Reserved** (see `LICENSE`). Keep `"license": "UNLICENSED"` in `package.json`. Never add an open-source license file or license headers.

## Commands

```bash
npm run dev       # http://localhost:4321
npm run check     # types + missing translations. Must report 0 errors.
npm run build     # -> dist/
npm run preview   # build + Cloudflare runtime on http://localhost:8787 (applies _headers, the generated _redirects, 404)
npm run deploy    # build + wrangler deploy
```

There are no tests. Verify with `check`, `build`, then `preview` plus curl or a headless screenshot. See [docs/deployment.md](docs/deployment.md#verifying-a-change).

## Rules

- Visible text goes in `src/i18n/en.json`, then `src/i18n/id.json`. Never hardcode it in a component or in `home.js`.
- Content that is the same in every language (links, stack, wallet, identity) goes in `src/data/site.ts`.
- Use absolute asset paths (`/assets/...`). Relative paths break on `/id/`.
- Keep the scene markup attributes (`class="scene"`, `id`, `data-title`, `data-out`, `data-a`, `data-split`, `data-track`, ...) that `home.js` depends on. Do not rename scene `id`s, because they are URL hashes.
- Keep the no-JavaScript and reduced-motion fallbacks working.
- Files in `public/assets/` are cached for 7 days without hashing. Rename a file, or add `?v=`, when you change it.
- When content changes, bump `UPDATED` in `src/data/site.ts` (it feeds the JSON-LD and the generated sitemap).
- Turn languages on or off only through `LANGUAGES` in `src/config.ts`. The pages, switcher, hreflang, sitemap and `_redirects` all follow it. Do not hand-write `/id/` links, a `public/sitemap.xml` or a `public/_redirects`.

## Docs

Read the relevant file in `docs/` before changing that area:

- [docs/architecture.md](docs/architecture.md): project layout and how a page is rendered
- [docs/content.md](docs/content.md): links, stack, wallet, adding a scene
- [docs/i18n.md](docs/i18n.md): translations and adding a language
- [docs/scene-engine.md](docs/scene-engine.md): `home.js`, input handling, the markup contract
- [docs/seo.md](docs/seo.md): meta tags, Open Graph, JSON-LD, sitemap
- [docs/deployment.md](docs/deployment.md): Cloudflare config, caching, verification

Update the matching doc when you change behaviour it describes.
