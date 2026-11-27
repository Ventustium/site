# ventustium.com

Source code for my personal site, [ventustium.com](https://ventustium.com). It is a single page built with [Astro](https://astro.build) and served as static files from [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/).

> **This repository is public so you can read the code. It is not open source.**
> All rights are reserved. You may not copy, reuse, modify, or deploy any part of it. See [LICENSE](LICENSE).

## Features

- **Scroll scenes.** The page does not scroll. Wheel, swipe and keyboard input switch between full-screen "scenes" (home, code, a featured project, off-hours, contact, tip jar). Each scene has its own entrance and exit choreography: split-text headings, scrambled labels, a typing effect, and cards that wipe or swing in. All of it uses the Web Animations API in about 400 lines of plain JavaScript, with no animation library.
- **Multilingual-ready.** The text for each language is a JSON file (`src/i18n/en.json`, `src/i18n/id.json`), type-checked against the English one so a missing translation fails the build check. One switch in `src/config.ts` publishes or hides a language: its page, the language switcher, `hreflang` tags, the sitemap and redirects all follow. English is live, and the Indonesian translation is in the repo but currently switched off.
- **Small and fast.** No UI framework ships to the browser. The page loads one stylesheet, self-hosted JetBrains Mono fonts (latin subset), and three small scripts. Images in scenes you have not opened yet are loaded on demand.
- **SEO and link previews.** It has schema.org `Person`, `WebSite` and `ProfilePage` JSON-LD, Open Graph and Twitter cards with a 1200×630 image, a generated sitemap, and an [`llms.txt`](public/llms.txt).
- **Graceful fallback.** If JavaScript or the Web Animations API is missing, the scenes become a normal scrolling page. `prefers-reduced-motion` is respected.

## Stack

| Part | Choice |
| --- | --- |
| Framework | Astro 7, static output |
| Language | TypeScript (build time), vanilla JS (browser) |
| Styling | Plain CSS with custom properties |
| Hosting | Cloudflare Workers static assets via Wrangler |
| Background | [particles.js](https://github.com/VincentGarreau/particles.js) |

## Project layout

```text
src/
  config.ts         site switches (which languages are published)
  pages/            index.astro (default language), [locale]/ (other languages),
                    404.astro, sitemap.xml.ts
  components/       HomePage, language switcher, ghost word, pills, cards
    scenes/         one component per scene
  layouts/Base.astro  <head>: meta, Open Graph, hreflang, JSON-LD
  i18n/             en.json, id.json (all text) and ui.ts (locale config)
  data/site.ts      links, wallet, identity (same in every language)
  scripts/home.js   scene engine (bundled by Astro)
  styles/home.css
public/
  assets/           images, fonts, particles.js and its config
  _headers          cache rules for Cloudflare
astro.config.mjs    build config; also writes dist/_redirects from src/config.ts
wrangler.jsonc      Cloudflare deployment config
```

## Running it

Requires Node.js 22.23 or newer.

```bash
npm install
npm run dev        # Astro dev server on http://localhost:4321
npm run check      # type-check, including translation completeness
npm run preview    # build, then serve dist/ with the Cloudflare runtime (wrangler dev)
npm run deploy     # build and deploy production (requires wrangler login)
npm run deploy:dev # build and deploy the staging Worker
```

## Documentation

How the site works, from the scene engine to translations and caching, is documented in [docs/](docs/README.md).

## License

Copyright © 2021–2026 Ventustium. All Rights Reserved. See [LICENSE](LICENSE).
