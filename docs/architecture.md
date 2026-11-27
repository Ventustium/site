# Architecture

The site is a single profile page, with one copy per published language (see [i18n.md](i18n.md)). Astro renders it to static HTML at build time. Cloudflare Workers serves the files from `dist/` as static assets. There is no server code, database, or Worker script.

## Project layout

```text
src/
  config.ts             site switches: which languages are published
  pages/
    index.astro         home page in the default language (/)
    [locale]/index.astro  home page for each other published language (/id/, ...)
    404.astro           shared not-found page
    sitemap.xml.ts      generates /sitemap.xml
  layouts/Base.astro    <html> and <head>: meta tags, Open Graph, hreflang, JSON-LD
  components/
    HomePage.astro      the whole page for one locale
    scenes/             Intro, Code, Play, Contact, Wallet (one per scene)
    Heading.astro       scene title with a gradient accent
    Card.astro          link card
    Pill.astro          Discord / email pill
    LangSwitch.astro    EN | ID switcher
    GhostWord.astro     large outlined word behind a scene (SVG)
    Icons.astro         inline SVG sprite and the ghost word gradient
  i18n/
    en.json, id.json    all visible text
    ui.ts               locale list and helpers
  data/site.ts          content that is the same in every language
  scripts/home.js       scene engine (browser)
  styles/home.css       all styles
public/                 copied to dist/ as-is (see deployment.md)
```

## How a page is rendered

1. `src/pages/index.astro` renders `<HomePage locale="en" />`. `src/pages/[locale]/index.astro` renders the same component once for every other published language, from `getStaticPaths()`.
2. `HomePage.astro` wraps everything in `Base.astro` and renders the five scenes in order, passing `locale` down.
3. Each scene calls `t(locale)` from `src/i18n/ui.ts` for its text and imports links and other shared values from `src/data/site.ts`.
4. `Base.astro` builds the `<head>` for that locale and imports `home.css`. Astro bundles and hashes the CSS and `home.js` into `/_astro/`.

The result is one HTML file per published language (`dist/index.html`, plus `dist/id/index.html` when Indonesian is on), differing only in language. After the build, an integration in `astro.config.mjs` writes `dist/_redirects` (see [deployment.md](deployment.md)).

## What runs in the browser

No UI framework. The page loads:

- `particles.min.js` and its config `app.js`: the animated background.
- `home.js`: the scene engine (see [scene-engine.md](scene-engine.md)) and the copy-to-clipboard button.
- A one-line inline script in `<head>` that adds the `js` class to `<html>` when the Web Animations API is available.

## Rules

- Use absolute paths (`/assets/...`) for every asset. A relative path breaks on `/id/`.
- Never hardcode visible text in a component. Put it in the locale JSON (see [i18n.md](i18n.md)).
- Keep the scene markup attributes that `home.js` depends on (see [scene-engine.md](scene-engine.md)).
