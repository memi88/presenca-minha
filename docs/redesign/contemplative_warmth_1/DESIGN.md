---
name: Contemplative Warmth
colors:
  surface: '#fff8f4'
  surface-dim: '#e2d8cf'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2e8'
  surface-container: '#fcebdc'
  surface-container-high: '#f1e6dd'
  surface-container-highest: '#ebe1d8'
  on-surface: '#1f1b15'
  on-surface-variant: '#4f4538'
  inverse-surface: '#35302a'
  inverse-on-surface: '#f9efe6'
  outline: '#817566'
  outline-variant: '#d3c4b3'
  surface-tint: '#7f5611'
  primary: '#5f3e00'
  on-primary: '#ffffff'
  primary-container: '#7c540e'
  on-primary-container: '#ffcc85'
  inverse-primary: '#f3bd6f'
  secondary: '#7c580a'
  on-secondary: '#ffffff'
  secondary-container: '#fecd77'
  on-secondary-container: '#795506'
  tertiary: '#4e432e'
  on-tertiary: '#ffffff'
  tertiary-container: '#675a44'
  on-tertiary-container: '#e4d2b6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb2'
  primary-fixed-dim: '#f3bd6f'
  on-primary-fixed: '#291800'
  on-primary-fixed-variant: '#624000'
  secondary-fixed: '#ffdeaa'
  secondary-fixed-dim: '#efbf6b'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#f3e0c4'
  tertiary-fixed-dim: '#d6c4a9'
  on-tertiary-fixed: '#231a09'
  on-tertiary-fixed-variant: '#514530'
  background: '#fff8f4'
  on-background: '#1f1b15'
  surface-variant: '#ebe1d8'
  ink-warm: '#221a11'
typography:
  display-lg:
    fontFamily: Spectral
    fontSize: 56px
    fontWeight: '300'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Spectral
    fontSize: 40px
    fontWeight: '300'
    lineHeight: 48px
  headline-lg:
    fontFamily: Spectral
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-md:
    fontFamily: Spectral
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  title-lg:
    fontFamily: Spectral
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 28px
  title-md:
    fontFamily: Spectral
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 24px
  body-lg:
    fontFamily: Spectral
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Spectral
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Bitter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Bitter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Bitter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-mobile: 24px
  gutter-mobile: 16px
  card-padding: 20px
  section-gap: 64px
  element-gap: 16px
  max-content-width: 1120px
---

## Brand & Style

The design system is centered on the theme of **Contemplative Warmth**, designed to evoke the tactile, intellectual atmosphere of a high-end literary journal or a private leather-bound notebook. It is tailored for an audience that values slow consumption, deep focus, and editorial sophistication.

The aesthetic follows an **Organic Minimalist** movement. It rejects the frantic energy of modern digital interfaces in favor of "chromatic elevation"—using shifts in parchment-like tones rather than aggressive shadows to define depth. Every interface element is intended to feel deliberate and hushed, fostering an environment of silence and reflection through a strictly serif-only typographic palette.

## Colors

The palette is strictly derived from warm, organic tones, avoiding all cool-spectrum fallbacks or blue-based grays. 

- **Primary & Secondary**: Golden, earth-toned ochres used for meaningful interaction and brand presence.
- **Tertiary**: A muted, stony taupe introduced for subtle accents and decorative elements.
- **Surfaces**: A tiered system of parchment whites and creams. Depth is achieved by moving from "Dim" (lower) to "Bright" (higher) tones to create visual hierarchy without relying on shadows.
- **Typography**: The primary ink color is a deep, warm charcoal (`#221a11`), ensuring high legibility while maintaining the system's organic warmth.

## Typography

This system uses a dual-serif approach to achieve editorial sophistication without any sans-serif interference.

- **Spectral**: Used for all narrative and structural levels (Display, Headline, Title, and Body). It provides a graceful, literary feel. Use the Light weight (300) for display text to emphasize elegance.
- **Bitter**: A sturdy slab-serif used exclusively for functional and metadata levels (Labels). Its robust nature ensures that buttons, navigation items, chips, and input labels remain legible and clearly distinguished from reading content.
- **Readability**: Body text is set with generous line-heights to mimic the comfortable experience of a printed book. All functional text (Bitter) should maintain a Medium (500) weight for structural clarity.

## Layout & Spacing

This design system uses a **Fluid Grid** model with generous margins to create a sense of air and focus.

- **Mobile**: Employs a 24px outer margin and 16px gutter. Layouts should stack vertically, prioritizing a single-column reading experience.
- **Desktop**: Shifts to a wide-margin layout with a max content width of 1120px to prevent line lengths from becoming too long for comfortable reading.
- **Rhythm**: Spacing is used to group related thoughts. Use the `section-gap` for major thematic shifts and `element-gap` for internal component relationships.

## Elevation & Depth

The system eschews traditional drop shadows in favor of **Tonal Layering**. Depth is communicated through the progression of the surface palette:

1.  **Background**: The base surface layer.
2.  **Resting Components**: Use `surface-container-low` to define standard component containers.
3.  **Elevated/Active State**: Use `surface-bright` or `surface-container-highest` to indicate prominence or interaction.

Where structural definition is required, use **Low-Contrast Outlines** (`outline-variant`) rather than shadows. This maintains a flat, book-like aesthetic while providing enough contrast for accessibility.

## Shapes

The shape language balances architectural rigidity with humanistic softness.

- **Containers**: Cards and sections use a **Rounded** (0.5rem) radius, creating a soft frame for content that feels modern yet grounded.
- **Interactive Elements**: Buttons and chips use a **Pill-shaped** (rounded-xl or full) radius. This high contrast in roundedness clearly distinguishes "static information" from "interactive triggers."
- **Borders**: Standard 1px weight for all outlines to mimic the fine lines of stationery.

## Components

- **Buttons**: Primary buttons are fully rounded (pill) using `primary` background and `on-primary` text. Typography must be `label-lg` in **Bitter**.
- **Navigation Items**: Use `label-md` (**Bitter**) with adequate letter spacing. Active states should be indicated by a weight shift or a subtle tonal background.
- **Cards**: Utilize `surface-container-low` with a 1rem corner radius. No shadows; use a subtle `outline-variant` for definition.
- **Input Fields**: Rectangular with a 0.25rem (Soft) radius to differentiate from buttons. Use `label-md` (**Bitter**) for the field labels and placeholder text.
- **Chips/Labels**: Use `tertiary` or `primary-container` backgrounds. These are pill-shaped and use `label-sm` (**Bitter**) for all functional metadata.
- **Lists**: Separated by `outline-variant` dividers. Ensure vertical padding of 16px+ to maintain the contemplative rhythm.
- **Feedback**: Errors use the `error` ochre-red, which is warm and visible without being jarringly bright.