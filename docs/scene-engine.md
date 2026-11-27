# Scene engine

`src/scripts/home.js` turns the page into full-screen "scenes" that switch on wheel, swipe and keyboard input instead of scrolling. It uses the Web Animations API and no library.

## Progressive enhancement

1. An inline script in `Base.astro` adds the `js` class to `<html>` if `Element.prototype.animate` exists.
2. With `html.js`, `home.css` fixes the viewport and hides inactive scenes before first paint. `home.js` then takes over.
3. Without it (no JavaScript, or an old browser), the scenes are ordinary sections in a scrolling page, and the pager and scroll hint are hidden.

`prefers-reduced-motion` shortens or removes the motion. Keep both fallbacks working when changing the CSS or the engine.

## Input

| Input | Action |
| --- | --- |
| Mouse wheel / trackpad | next or previous scene, after the scroll passes a threshold |
| Vertical swipe over 50px | next or previous scene |
| Arrow keys, Page Up/Down, Space | next or previous scene |
| Home / End | first or last scene |
| Pager button | that scene |
| URL hash (`/#wallet`) | that scene, on load and on `hashchange` |

The engine updates the hash with `history.replaceState` as you move between scenes.

## Markup contract

The engine reads these attributes, so components must keep them:

| Attribute | On | Meaning |
| --- | --- | --- |
| `class="scene"` | `<section>` | one scene |
| `id` | scene | URL hash. Keep `home`, `code`, `play`, `contact` and `wallet` stable and the same in every language, because they are linked from outside (for example the `/wallet` redirect). |
| `data-title` | scene | pager label (translated) |
| `data-out` | scene | how the scene leaves: `zoom`, `items` or `slide` |
| `data-a` | any element | entrance animation: `fade`, `wipe`, `tilt`, `pill`, `pop`, `rise`, `ghost`, `logo`, `type` |
| `data-split` | heading | split into `words` or `chars` before animating (see `Heading.astro`) |
| `data-variant` | split heading | character effect: `flip`, `zoom` or `scatter` |
| `data-scramble` | text | scrambled-letter reveal |
| `data-src` | `<img>` | image loaded only when its scene first opens |
| `data-copy` | `<button>` | copies the text of the element matching this selector |
| `data-done` | copy button | label shown after copying |
| `data-go` | `nav.pager` | prefix for the pager buttons' `aria-label` |

## Background mood

Each scene shifts the background glow and the particles layer (position, scale, hue) through CSS custom properties that `home.js` sets. Those transitions are in the "background" section of `home.css`.

## Scripts and bundling

- Astro bundles `home.js` as a module, hashes it, and serves it from `/_astro/`.
- `particles.min.js` and its config `app.js` define globals, so they stay in `public/assets/js/`. They load as plain deferred scripts (`is:inline` in `HomePage.astro`). `home.js` does not depend on them.
