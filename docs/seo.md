# SEO and link previews

`src/layouts/Base.astro` builds the whole `<head>` for each locale from the locale JSON (`meta` group) and `src/data/site.ts`.

## Per page

| Output | Source |
| --- | --- |
| `<title>`, meta description | `meta.title`, `meta.description` |
| canonical | `https://ventustium.com/` or `https://ventustium.com/id/` |
| `hreflang` alternates | one per locale, plus `x-default` pointing to `/` |
| Open Graph / Twitter card | `meta.socialDescription`, `meta.ogImageAlt`, `og:locale` per language |
| JSON-LD | `Person`, `WebSite` and `ProfilePage` (see below) |

Link previews on Discord, WhatsApp, Telegram and X use `public/assets/image/og.jpg` (1200×630, opaque background) with `summary_large_image`. `theme-color` (`#7b4dff`) also sets the colour of the Discord embed bar.

## Structured data

- `Person`: name, alternate names, email, `jobTitle` and `description` from `meta`, `knowsAbout` from `stack`, and `sameAs` with every profile link.
- `WebSite`: lists both languages in `inLanguage`.
- `ProfilePage`: one per locale, with `dateModified` set to `UPDATED`.

## Files in public/

| File | Purpose |
| --- | --- |
| `sitemap.xml` | both pages with `xhtml:link` language alternates |
| `robots.txt` | allows everything and points to the sitemap |
| `llms.txt` | plain-text profile summary for AI assistants |

## When content changes

1. Bump `UPDATED` in `src/data/site.ts`.
2. Update both `<lastmod>` values in `public/sitemap.xml`.
3. Update `public/llms.txt` if facts or links changed.
4. If you replace `og.jpg`, give it a new filename and update `Base.astro`. Platforms cache preview images aggressively.

## 404 page

`src/pages/404.astro` is one file that shows both languages. It passes `noindex` to `Base.astro`, which drops the canonical URL, the alternates and the JSON-LD.
