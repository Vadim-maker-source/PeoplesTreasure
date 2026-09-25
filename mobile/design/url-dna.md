# Next.js visual DNA

source: http://localhost:3001
captured: 2026-09-25

## Brand

- identity: «Сокровища народов»
- logo: four rounded orange/yellow petals, original assets from `public/images`
- tone: warm educational community, clean white surfaces, orange calls to action

## Tokens

- font: Nunito, 400 body, 600 controls, 700 headings
- background-light: `#FFF9F9`
- background-dark: `#364153`
- section-light: `#FFF0F0`
- surface-light: `#FFFFFF`
- surface-dark: `#111827`
- accent: `#FF7340`
- action: `#FFB840`
- action-hover: `#FFCB73`
- action-gradient-end: `#FF4500`
- text: `#111827`
- muted-text: `#4B5563`
- border: `#E5E7EB`
- muted-surface: `#F9FAFB`
- radius-input: 6 px on auth, 12 px on content forms
- radius-card: 16 px
- radius-media: 24 px
- radius-pill: 999 px
- shadow-card: soft neutral shadow, 0 10 25 at 10–14% black

## Layout

- mobile horizontal padding: 16 px
- content-page vertical padding: 48 px on web, 20–24 px on mobile
- auth card: max 448 px, 24–32 px inner padding, centered over `SignBg.png`
- site header: pale pink/dark navy fixed surface, compact logo, orange/yellow actions
- content cards: white/dark navy with subtle border; no blur or glass
- primary buttons: orange or orange-to-red gradient, white label
- secondary buttons: yellow fill, orange border, dark label

## Motion

- 200–300 ms opacity/color transitions
- no spring scaling or decorative glass motion
- loading indicators use accent orange

## Flutter mapping

- `AppTheme`: source palette, Nunito typography, site radii and shadows
- `BrandMark`: original logo image
- `GlassSurface`: retained API name but implemented as the site's opaque card
- auth: original background/logo and source card hierarchy
- shell: source-colored fixed header/bottom navigation
- forms and cards: source borders, fills and button hierarchy
