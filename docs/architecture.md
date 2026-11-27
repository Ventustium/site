# Architecture

The site is a single profile page in two languages. Astro renders it to static HTML at build time. Cloudflare Workers serves the files from `dist/` as static assets. There is no server code, database, or Worker script.

## Project layout

```text
src/
  pages/
    index.astro         English home page (/)
    id/index.astro      Indonesian home page (/id/)
    404.astro           shared not-found page
  layouts/Base.astro    <html> and <head>: meta tags, Open Graph, hreflang, JSON-LD
  components/
    HomePage.astro      the whole page for one locale
    scenes/             Intro, Code, Play, Contact, Wallet (one per scene)
    Heading.astro       scene title with a gradient accent
    Card.astro          link card
    Pill.astro          Discord / email pill
    LangSwitch.astro    EN | ID switcher
    Icons.astro         inline SVG sprite
  i18n/
    en.json, id.json    all visible text
    ui.ts               locale list and helpers
  data/site.ts          content that is the same in every language
  scripts/home.js       scene engine (browser)
  styles/home.css       all styles
public/                 copied to dist/ as-is (see deployment.md)
```

## How a page is rendered

1. `src/pages/index.astro` and `src/pages/id/index.astro` contain only `<HomePage locale="en" />` or `<HomePage locale="id" />`.
2. `HomePage.astro` wraps everything in `Base.astro` and renders the five scenes in order, passing `locale` down.
3. Each scene calls `t(locale)` from `src/i18n/ui.ts` for its text and imports links and other shared values from `src/data/site.ts`.
4. `Base.astro` builds the `<head>` for that locale and imports `home.css`. Astro bundles and hashes the CSS and `home.js` into `/_astro/`.

The result is two HTML files, `dist/index.html` and `dist/id/index.html`, that differ only in language.

## What runs in the browser

No UI framework. The page loads:

- `particles.min.js` and its config `app.js`: the animated background.
- `home.js`: the scene engine (see [scene-engine.md](scene-engine.md)) and the copy-to-clipboard button.
- A one-line inline script in `<head>` that adds the `js` class to `<html>` when the Web Animations API is available.

## Rules

- Use absolute paths (`/assets/...`) for every asset. A relative path breaks on `/id/`.
- Never hardcode visible text in a component. Put it in the locale JSON (see [i18n.md](i18n.md)).
- Keep the scene markup attributes that `home.js` depends on (see [scene-engine.md](scene-engine.md)).
