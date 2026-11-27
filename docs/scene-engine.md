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

A scene taller than the screen (phones, short windows) scrolls inside itself (`.js .scene` has `overflow-y: auto`). Wheel, swipe and the keys above scroll it first; they switch scenes only from its top or bottom edge. A swipe must start at that edge, and wheel momentum that has just scrolled the scene is ignored for 350 ms, so a fling never skips into the next scene. Entering a scene going down starts at its top; coming back up starts at its bottom.

### Rush mode

Input that arrives while a scene is still animating never skips an animation. `hurry()` speeds every running Web Animation in the scenes up to `RUSH` (3×) and shortens the gap before the next scene. A swipe, an arrow or page key, or the pager also queues one more step, which plays at 3× as well. The wheel and trackpad only speed up and never queue, because their input is too noisy to trust with an extra page. Once a scene finishes with nothing queued, `pace` returns to 1. Only one step is queued: scrolling five times does not stack five moves.

- Wheel: one continuous scroll moves one scene, whether it is a mouse wheel spun on or a trackpad fling. To go further, scroll again after a pause of about 300 ms. Shrinking deltas (momentum) never count.
- Every scene rests for `DWELL` (500 ms) after it has entered. Wheel input during the rest is ignored, so heavy scrolling stops on each page instead of running to the last one. A swipe, key, pager click or `#hash` link during the rest is kept and runs when it ends.
- Swipe, arrow and page keys, and the pager hurry and queue straight away.
- The typewriter and the scrambled labels are timers, so they follow `pace` themselves. A scrambled label reveals its letters at the current pace (faster in rush mode, even mid-way), while its random glyphs only change every `SCRAMBLE_SWAP` (60 ms) at any pace.
- CSS animations (caret, live dot, scroll hint) are left alone.

The engine updates the hash with `history.replaceState` as you move between scenes.

The scroll hint at the bottom (`.hint`) is three chevrons that light up top to bottom, with the translated `chrome.scroll` label under them. It hides on the last scene.

## Markup contract

The engine reads these attributes, so components must keep them:

| Attribute | On | Meaning |
| --- | --- | --- |
| `class="scene"` | `<section>` | one scene |
| `id` | scene | URL hash. Keep `home`, `code`, `play`, `project`, `contact` and `wallet` stable and the same in every language, because they are linked from outside (for example the `/wallet` redirect). |
| `data-title` | scene | pager label (translated) |
| `data-out` | scene | how the scene leaves: `zoom`, `items` or `slide` |
| `data-a` | any element | entrance animation: `fade`, `wipe`, `tilt`, `pill`, `pop`, `rise`, `ghost`, `logo`, `type` |
| `data-split` | heading | split into `words` or `chars` before animating (see `Heading.astro`) |
| `data-variant` | split heading | character effect: `flip`, `zoom` or `scatter` |
| `data-scramble` | text | scrambled-letter reveal |
| `data-track="<ms>"` | container | its `data-a` elements run on their own timeline starting `<ms>` after the scene opens, in parallel with the rest (used on `.cards`, `.showcase` and `.wallet`) |
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

- Put `data-a` on the frosted element itself (`a.card`, `.showcase`, `.wallet`), never on a wrapper. The element's own opacity, clip and filter then apply to its blur, and the frosted glass animates in with the card. On a wrapper, the blur appears only after the animation ends.
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
- In split scenes laid out side by side (over 720px), its inner edge is pinned to the inner edge of the text column with `calc()` on `--split-gap`, and it grows toward the screen edge. It therefore never goes under the cards, whose frosted blur would hide it. It is on the left in `code`, `play` and `wallet`, and on the right in `project` (`.split--flip`).
- At 720px and below, where two-column scenes stack, it sits at the top right, by the title.

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
