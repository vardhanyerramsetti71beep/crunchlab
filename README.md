# Crunchlab

A scroll-driven 3D chips website: a cinematic chip-storm loader, a hero carousel of real-time 3D bags, a scroll story, a chip storm, a flavor wall and a build-your-own 3-pack.

Crunchlab is a fictional brand made for a portfolio demo. All pack art is drawn in code at load time, so there are no image or model files.

## Run it

```bash
npm install
npm run dev
```

Build for production with `npm run build` (output in `dist/`).

## Stack

Vite · Three.js · GSAP + ScrollTrigger · Lenis · plain JS and CSS.

## How it works

| File | What it does |
| --- | --- |
| `src/flavors.js` | The six flavors: colors, copy and heat level. Everything else is themed from this. |
| `src/packArt.js` | Draws the front and back pack art for each flavor onto 2D canvases. |
| `src/bag.js` | Builds the pillow-shaped bag mesh with crimped seals. |
| `src/chips.js` | A saddle-shaped chip mesh and its texture, used by the instanced chip fields. |
| `src/experience.js` | The single fixed WebGL canvas. Sections write progress into `state`, and each frame the bags and chips ease toward the pose it implies. Also renders the shop product shots. |
| `src/preloader.js` | The 2D chip storm, real progress counter and the season-and-burst reveal. |
| `src/hero.js` | Carousel (arrows, dots, swipe, keys, autoplay), page re-theming and the ring sweep. |
| `src/story.js` | Scroll progress for the four-chapter story, chip storm and the callout that follows the bag. |
| `src/shop.js` | Flavor wall and 3-pack tray. Demo only: nothing is charged and the email form sends nothing. |

Respects `prefers-reduced-motion` (no smooth scroll, autoplay or long loader).
