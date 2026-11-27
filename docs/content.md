# Editing content

Profile content lives in two places:

- `src/data/site.ts` holds facts that do not change between languages: name, email, Discord, links, tech stack and wallet.
- `src/i18n/en.json` and `src/i18n/id.json` hold every sentence and label (see [i18n.md](i18n.md)).

After changing content, bump `UPDATED` in `src/data/site.ts`. It feeds the JSON-LD and the sitemap's `<lastmod>` (see [seo.md](seo.md)).

## Links

Link cards are arrays in `src/data/site.ts`:

| Array | Scene |
| --- | --- |
| `codeLinks` | code (GitHub, GitLab) |
| `playLinks` | off-hours (Steam, osu!, WebNovels TL) |

Each entry is `{ label, url, me? }`. The card shows `label` and the URL without `https://` or a trailing slash. Set `me: true` on profiles you own, which adds `rel="me"`. Every link is also added to `sameAs` in the JSON-LD automatically.

Discord and email are in `discord` and `person`. They appear as pills on the home and contact scenes.

Update `public/llms.txt` as well when links change.

## Tech stack

`stack` in `src/data/site.ts` renders as the tags on the code scene and feeds `knowsAbout` in the JSON-LD. The meta description and bio in the locale JSON also name some of these tools, so update those too.

## Featured project

The `project` scene promotes Prose Realm as a live project in active development. Its name and URL are `project` in `src/data/site.ts`. The text, feature chips and status line ("live · in active development") are the `project` group in the locale JSON. The pulsing dot next to the status is CSS (`.showcase .dot`).

The panel shows a screenshot, `project.image` (`public/assets/image/prose-realm-2.webp`, 840×525 WebP of the home page in dark mode). It loads only when the scene opens, and is hidden on short phones (720px wide or less and 760px tall or less), where the stacked scene has no room for it. To refresh it, take a new 1280×800 screenshot (scroll the page first so lazy-loaded covers appear, then back to the top), convert it (for example `magick shot.png -resize 840x -quality 78 new-name.webp`), give it a new filename because `/assets/` is cached for 7 days, and update `project.image`.

To feature another project, change `project` in `site.ts` and the `project` text. If it is finished, also change `status` and `label`.

## Tip jar

`wallet` in `src/data/site.ts` holds the network, the address and the paths to the QR code and logo. When the address changes, regenerate `public/assets/image/wallet-eth-qr.svg` and give it a new filename. `/assets/` is cached for 7 days (see [deployment.md](deployment.md)).

## Adding a scene

1. Create `src/components/scenes/<Name>.astro`. Copy an existing scene and keep its `section.scene` structure and `data-*` attributes (see [scene-engine.md](scene-engine.md)). In a two-column scene, the text goes in `div.text` and the side column (cards or panel) gets `data-track` so it animates in parallel.
2. Give the section a unique `id`. It becomes the URL hash, for example `/#name`.
3. Add its text under a new key in `en.json` and then `id.json`. Include `nav`, which is the pager label.
4. Render it in `src/components/HomePage.astro` at the position you want.

The pager builds itself from the scenes, so it needs no change.
