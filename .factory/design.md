# Clipboard LAN Bridge — visual thesis

## Direction

**Art-deco transit poster, reinterpreted as a private local route map.** A clipboard handoff is not an invisible sync: it is a small parcel deliberately routed from one nearby device to another. The interface borrows the geometry, ticket punches, cream stock, brass signage, and crisp route lines of 1930s rail posters without imitating any historic operator or mark. Parallel lines and a single moving “ticket” make direction, locality, and expiry legible.

The product is intentionally single-mode. A deep midnight station wall surrounds warm paper surfaces; this is not a theme preference but the product's calm, private control-room identity. Cream content panels keep long copy highly legible.

## Tokens

- `--ink: #102a2b` — near-black green, primary background and text on paper.
- `--paper: #f6efdc` — warm ticket stock; primary light surface.
- `--paper-dim: #ddd2b8` — recessed paper.
- `--signal: #e45b38` — vermilion route/single primary action.
- `--signal-dark: #9e351f` — accessible pressed treatment.
- `--brass: #e5bd58` — wayfinding accent and focus.
- `--jade: #2c7668` — connected/success.
- `--warning: #8c541e`; `--danger: #a8322d`.
- Primary text on dark: `#f6efdc`; muted text on dark: `#c8c1ac`.
- Primary text on paper: `#102a2b`; muted text on paper: `#4f625e`.

All body text combinations meet 4.5:1. Vermilion is used for filled actions, never for small text on cream. Status always has an icon/word in addition to color.

## Type

- Display: **Routed Display**, a hand-authored local SVG/shape-informed treatment expressed with the self-hosted system fallback `Georgia, Charter, serif`; uppercase, 0.04em tracking, compact leading. This gives poster authority without a font download.
- Interface/body: `Avenir Next, Inter, ui-sans-serif, system-ui, sans-serif`; clear at small sizes and native to the utility context.
- Scale: 12 / 14 / 16 / 20 / 28 / clamp(42–72) px. Body is 16px minimum. Device codes and timestamps use tabular figures.

## Spacing and shape

An 8px base rhythm with 4px for optical nudges. Page gutters are 20px mobile, 40–64px desktop. Reading measure is 68ch. Corners are clipped or modest (2–12px), not pill-heavy. Ticket perforations and parallel route rails are the recurring motifs. Touch targets are at least 44px.

## Interaction grammar

- **Send** is the sole vermilion action. Everything else is paper, brass outline, or text.
- Device selection resembles choosing a platform: one row, one clear connected/offline state.
- Pairing is explicit: both devices compare the same six-character code and the receiver approves.
- Transfers enter from the sending edge and settle into the receiving queue. Expiry is presented as a stamped time.
- Clipboard access only occurs after a user action. The app never reads or watches it in the background.

## Motion

Transitions last 180–260ms and animate only transform/opacity. A sent ticket travels once along the route and stops; there are no looping animations. `prefers-reduced-motion: reduce` removes travel and scrolling, retaining instant state and opacity feedback. Status changes remain understandable without motion.

## Generated hero asset plan

One raster poster illustration supports the landing page and explains the product world; the operational app uses hand-authored CSS/SVG geometry so decoration never obscures controls.

Prompt sheet:

> Use case: stylized-concept. Asset type: wide landing-page hero illustration. Primary request: an original art-deco transit poster metaphor for a private clipboard handoff across a local network. Scene: midnight station-map world with four simplified device silhouettes—phone, laptop, desktop, small tablet—connected by one warm vermilion route, and a small cream paper ticket visibly traveling between two stops. Style: screen-printed 1930s geometric travel poster, flat shapes, precise stepped arches, subtle paper grain, no gradients. Composition: wide 3:2, devices clustered on the right two-thirds, quiet negative space at upper left for page copy, clear route direction. Palette: deep ink green, warm cream, vermilion, muted brass, restrained jade. Light: graphic pool-of-light shapes, calm and trustworthy. Materials: uncoated paper, lightly misregistered ink. Constraints: no readable text, no letters, no numbers, no watermark, no logos, no brands, no people, no cloud symbols, no padlocks, no QR codes, no cables, no photorealism, no generic blue/purple gradient, no unintended symbols.

Generation provenance: Azure OpenAI factory image deployment via `/opt/fleet/lib/gen-image.sh`, generated 2026-08-28. Original project asset; prompt above. Candidates are reviewed for artifacts, unintended symbols, brand marks, misleading capabilities, and palette consistency. Final output is converted to responsive WebP (32 KB mobile, 65 KB desktop) with the lossless PNG source retained in `assets/src/`. An AVIF candidate was rejected because this worker's encoder produced a larger file.

## Hand-authored assets

The bridge mark, route dividers, device pictograms, and ticket perforations are original inline SVG/CSS shapes authored for this repository. They use no external icon library.

## Phone companion treatment

The phone companion is served by the installed desktop app and uses the same ticket-stock surfaces, transit rails, clipped controls, and ink/brass/vermilion tokens. Its narrow layout drops the poster illustration and download chrome so pairing, sending, and arrivals remain the only visual hierarchy at 390 px. The bundled cryptography code and all interface assets are self-hosted by the app; the companion loads no remote fonts, scripts, or images.
