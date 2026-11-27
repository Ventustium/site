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
| `data-track="<ms>"` | container | its `data-a` elements run on their own timeline starting `<ms>` after the scene opens, in parallel with the rest (used on `.cards` and `.wallet`) |
| `data-src` | `<img>` | image loaded only when its scene first opens |
| `data-copy` | `<button>` | copies the text of the element matching this selector |
| `data-done` | copy button | label shown after copying |
| `data-go` | `nav.pager` | prefix for the pager buttons' `aria-label` |

## Frosted cards and backdrop blur

Cards and the wallet panel use `backdrop-filter: blur(8px)` over the particles. Chrome stops the blur from seeing anything behind it if the element sits inside one of these:

- an **ancestor** with `opacity` below 1, `filter`, `clip-path`, `mask` or `mix-blend-mode`, which includes an ancestor that is mid-animation on those properties
- a **parent** with `perspective` (3D context)
- a stacking context that holds **any** element with `mix-blend-mode`, which isolates `.stage`

So:

- Put `data-a` on the frosted element itself (`a.card`, `.wallet`), never on a wrapper. The element's own opacity, clip and filter then apply to its blur, and the frosted glass animates in with the card. On a wrapper, the blur appears only after the animation ends.
- For 3D motion, write `perspective(...)` inside the keyframe `transform` (see `tilt` in `home.js`) instead of setting `perspective` on a parent.
- Do not use `mix-blend-mode` anywhere inside `.stage`.

## Entrance timing

`playIn` staggers the `data-a` elements of a scene one after another, in DOM order. Without tracks, the cards would wait until every element of the text column (label, title, description, each tech chip) had started. The cards and the wallet panel carry `data-track="350"`, so they start 350 ms after the scene opens while the text column is still animating. Add `data-track` to any new side column that should not wait.

## Ghost word

The large word behind each scene comes from `src/components/GhostWord.astro`. It is SVG `<text>`, not CSS text, because CSS `-webkit-text-stroke` takes a single colour, while SVG can stroke with a gradient. The outline is drawn with `#ghost-grad` (teal → violet → pink, the same stops as `--accent`), defined in `Icons.astro`. It has no fill. The stroke width is in viewBox units (`.6`, about 1–1.5px on screen).

- The SVG is `1em` tall with a width taken from its viewBox, so the span sizes and positions like plain text. The viewBox width is computed from the word length (JetBrains Mono advances every glyph 0.6em).
- Letter spacing is `SPACING` in `GhostWord.astro`, in hundredths of an em. It is `-5`, tight display tracking, so neighbouring outlines overlap a little by design.
- Stroke width and opacity are in `.ghost-word text` in `home.css`.

Placement:

- It sits behind the content (`z-index: -1`).
- In split scenes on wide screens (over 860px), its inner edge is pinned to the inner edge of the text column with `calc()` on `--split-gap`, and it grows toward the screen edge. It therefore never goes under the cards, whose frosted blur would hide it. It is on the left in `code` and `wallet`, and on the right in `play` (`.split--flip`).
- On narrow screens, where the layout stacks, it sits at the right (top right below 640px).

Entrance: the ghost word is the scene's opener. It fades in over 500 ms while `drawGhost()` in `home.js` "handwrites" the outline. It animates `stroke-dasharray` from `0 160` to `160 0`, so the outline of every glyph is split into 160-unit dashes that all grow at once: each letter is written by 2–3 pens at the same time, and all letters together. The rest of the scene (text column and `data-track` columns) starts after `GHOST_LEAD`, without waiting for the outline to finish. Because the content has its own fade, it becomes visible about halfway through the draw. Scenes without a ghost word (home) start right away.

| Constant in `home.js` | Default | Effect |
| --- | --- | --- |
| `GHOST_PEN` | `160` | dash length; smaller means more pens per letter |
| `GHOST_DRAW` | `2000` ms | time to write the whole outline |
| `GHOST_LEAD` | `800` ms | when the content starts (visible around mid-draw) |

Reduced motion skips the draw and the lead, so the content appears with the usual short fade.

The `ghost` keyframes leave the end opacity out, so the animation settles on the CSS value. Keep it that way if you give `.ghost-word` an opacity.

## Background mood

Each scene shifts the background glow and the particles layer (position, scale, hue) through CSS custom properties that `home.js` sets. Those transitions are in the "background" section of `home.css`.

## Scripts and bundling

- Astro bundles `home.js` as a module, hashes it, and serves it from `/_astro/`.
- `particles.min.js` and its config `app.js` define globals, so they stay in `public/assets/js/`. They load as plain deferred scripts (`is:inline` in `HomePage.astro`). `home.js` does not depend on them.
