# BUKO reference assets

## Current supplied photographs

The homepage hero uses the user's `Luxury Fine Dining Steak Photography – Dark Moody Gourmet Style.jpg`, saved as `public/images/hero-steak.webp` (736 × 1104). The Our Story page uses the user's kitchen photograph of carved steak on a fork, saved as `public/images/story-steak.webp` (736 × 1103).

Both supplied photos retain their original composition, dimensions and proportions, with quality-95 WebP conversion only. No generated additions or retouching were made. Responsive CSS controls the crop. `scripts/install-supplied-photos.mjs` records the import. These replace the earlier generated hero and story images; the older files below remain archival assets.

The desktop composition follows the user’s latest reference, `ChatGPT Image Sep 24, 2026, 11_55_59 AM.png`.

The built-in image generation tool produced the replacement images. These are concept imagery based on the supplied design, not documentary photographs of the restaurant or confirmed menu. Replace them with commissioned restaurant photography when available.

| Asset | Source resolution | Website file |
| --- | --- | --- |
| Dining hero | 2172 × 724 | `public/images/hero-v2.webp` |
| Mobile hero | 2172 × 724 | `public/images/hero-mobile-v2.webp` |
| Karoo lamb | 1448 × 1086 | `public/images/lamb-v2.webp` |
| Kingklip | 1448 × 1086 | `public/images/kingklip-v2.webp` |
| Chocolate mousse | 1448 × 1086 | `public/images/chocolate-v2.webp` |
| Dining room | 2172 × 724 | `public/images/interior-v2.webp` |

Images are supplied as quality-94 WebP files and served through responsive Next.js image optimisation. Hero rendering uses quality 95 and food photography uses 90. Versioned filenames avoid stale browser and image-optimiser caches.

Exact generation prompts are in [image-prompts.json](image-prompts.json). The originals remain at the generation tool’s saved locations recorded in `scripts/generated-assets.json`; all website-consumed assets are stored in the project.

All headings, navigation, calls to action and decorative text are HTML. The geometric reservation motif is an SVG pattern. No screenshot is used as an interactive page.
