# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static single-page website for Irit Shimoni's chocolate workshop business. Hebrew language, RTL layout. No build tools or package manager — open `index.html` directly in a browser.

## Development

No build step. To preview locally, open `index.html` in a browser or use a simple static server:
```
npx serve .
# or
python -m http.server
```

CSS and JS files use cache-busting query strings in `index.html` (e.g., `?v=11`, `?v=8`). Increment these when making changes that need to be reloaded in browsers with cached assets.

## Architecture

Three files drive the entire site:

- **`index.html`** — Single page with sections: `#hero`, `#workshop`, `#qa`, `#contact`. Wave divider `<div>`s sit between sections.
- **`css/styles.css`** — All styles. RTL layout (`direction: rtl`), color palette centered on dark chocolate brown (`#662502`, `#7C3913`) and cream (`#fffff2`).
- **`js/main.js`** — Three independent concerns:
  1. Mobile nav toggle (hamburger → X animation)
  2. Accordion (Q&A section, single-open behavior)
  3. Scroll-reactive animated SVG wave dividers — two separate systems: section dividers (`.wave-divider`) and navbar bottom edge (`.navWaveFill` / `.navWaveStroke`), each using `requestAnimationFrame` loops with lerp smoothing

## Images

Images were reorganized into subdirectories. Current structure:
- `images/chocolate pictures/` — product photos (numbered)
- `images/people at workshop/` — workshop participant photos
- `images/pralines/` — praline photos (numbered 1–18)
- `images/irit-placeholder.jpg` — placeholder for Irit's portrait in the hero section

The HTML still references some flat paths (e.g., `images/workshop-gallery-back.jpg`) that don't exist yet — these are placeholders for future gallery images.

## Key Design Patterns

- The navbar uses `padding-bottom: 50px` + `::before` pseudo-element to create a colored bar above the wave SVG that forms its bottom edge.
- Gallery blocks use a `.gallery__stack` with two overlapping `.gallery__back-img` / `.gallery__front-img` divs for a layered card effect. Clicking opens a lightbox (`#lightbox`), currently showing a placeholder message.
- `onerror` handlers on `<img>` tags hide broken images or show placeholder text gracefully.
