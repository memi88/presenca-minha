---
name: Contemplative Warmth
colors:
  surface: '#fff8f4'
  surface-dim: '#e2d9cf'
  surface-bright: '#fff8f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2e8'
  surface-container: '#fcebdc'
  surface-container-high: '#f0e7dd'
  surface-container-highest: '#eae1d7'
  on-surface: '#1f1b15'
  on-surface-variant: '#4e453a'
  inverse-surface: '#343029'
  inverse-on-surface: '#f9efe5'
  outline: '#807569'
  outline-variant: '#d2c4b6'
  surface-tint: '#77592a'
  primary: '#271700'
  on-primary: '#ffffff'
  primary-container: '#422a00'
  on-primary-container: '#b5905c'
  inverse-primary: '#e8c087'
  secondary: '#7c580a'
  on-secondary: '#ffffff'
  secondary-container: '#fecd77'
  on-secondary-container: '#795506'
  tertiary: '#211807'
  on-tertiary: '#ffffff'
  tertiary-container: '#372d1a'
  on-tertiary-container: '#a3947b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb1'
  primary-fixed-dim: '#e8c087'
  on-primary-fixed: '#291800'
  on-primary-fixed-variant: '#5d4214'
  secondary-fixed: '#ffdeaa'
  secondary-fixed-dim: '#efbf6b'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#f2e0c4'
  tertiary-fixed-dim: '#d5c4a9'
  on-tertiary-fixed: '#231a09'
  on-tertiary-fixed-variant: '#514530'
  background: '#fff8f3'
  on-background: '#1f1b15'
  surface-variant: '#eae1d7'
  ink-warm: '#221a11'
  outline-warm: '#817567'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 56px
    fontWeight: '300'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Fraunces
    fontSize: 40px
    fontWeight: '300'
    lineHeight: 48px
  headline-lg:
    fontFamily: Fraunces
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  title-lg:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: Fraunces
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Fraunces
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Bitter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Bitter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  button:
    fontFamily: Bitter
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  navigation:
    fontFamily: Bitter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
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

The design system is centered on the theme of **Contemplative Warmth**, evoking the tactile, intellectual atmosphere of a high-end literary journal or a private leather-bound notebook. It is tailored for an audience that values slow consumption, deep focus, and editorial sophistication.

The aesthetic follows an **Organic Minimalist** movement. It rejects the frantic energy of modern digital interfaces in favor of "chromatic elevation"—using shifts in parchment-like tones rather than aggressive shadows to define depth. Every interface element is intended to feel deliberate and hushed, fostering an environment of silence and reflection through a dual-serif typographic palette that avoids the sterility of sans-serif fonts. Icons must utilize an organic, hand-drawn stroke style to complement the humanistic qualities of the brand.

## Colors

The palette is strictly derived from warm, organic tones, avoiding all cool-spectrum fallbacks or blue-based grays.

- **Primary & Secondary**: Golden, earth-toned ochres used for meaningful interaction and brand presence.
- **Tertiary**: A muted, stony taupe introduced for subtle accents and decorative elements.
- **Surfaces**: A tiered system of parchment whites and creams. Depth is achieved by moving from "Dim" to "Bright" tones to create visual hierarchy without relying on shadows.
- **Typography**: The primary ink color is a deep, warm charcoal (`ink-warm`), ensuring high legibility while maintaining the system's organic warmth.

## Typography

This system utilizes a strictly serif-based approach to typography. No sans-serif fonts are permitted.

- **Editorial Narrative**: **Fraunces** is used for all Display, Headline, Title, and Body text. Display levels use a delicate light weight (300) to emphasize elegance. Body text (400) is set with generous line-heights to mimic a printed book.
- **Utility & Interface**: **Bitter** is used for functional elements including Labels, Buttons, and Navigation. The slab-serif qualities of Bitter provide the necessary structural "snap" to distinguish interface triggers and metadata from reading content. 
- **Readability**: Ensure all text uses the `ink-warm` color for optimal contrast against parchment backgrounds.

## Layout & Spacing

This design system uses a **Fluid Grid** model with generous margins to create a sense of air and focus.

- **Mobile**: Employs a 24px outer margin and 16px gutter. Layouts should stack vertically, prioritizing a single-column reading experience.
- **Desktop**: Shifts to a wide-margin layout with a max content width of 1120px to prevent line lengths from becoming too long for comfortable reading.
- **Rhythm**: Spacing is used to group related thoughts. Use the `section-gap` for major thematic shifts and `element-gap` for internal component relationships.

## Elevation & Depth

The system eschews traditional drop shadows in favor of **Tonal Layering**. Depth is communicated through the progression of the surface palette:

1. **Background**: The base surface layer (`surface`).
2. **Resting Components**: Use `surface-container-low` or `surface-container` to define standard component containers.
3. **Elevated/Active State**: Use `surface-bright` or `surface-container-highest` to indicate prominence or interaction.

Where structural definition is required, use **Low-Contrast Outlines** (`outline-variant`) rather than shadows. This maintains a flat, book-like aesthetic while providing enough contrast for accessibility.

## Shapes

The shape language balances architectural rigidity with humanistic softness.

- **Containers**: Cards and sections use a **Rounded** (0.5rem) radius, creating a soft frame for content that feels modern yet grounded.
- **Interactive Elements**: Primary buttons and chips use a **Pill-shaped** (rounded-xl or full) radius. This high contrast in roundedness clearly distinguishes "static information" from "interactive triggers."
- **Borders**: Standard 1px weight for all outlines to mimic the fine lines of professional stationery.

## Components

- **Buttons**: Primary buttons are fully rounded (pill) using `primary` background and `on-primary` text. Typography is set in **Bitter (700)**.
- **Navigation Items**: Use `navigation` tokens (**Bitter 500**). Active states are indicated by a subtle tonal background shift rather than an underline.
- **Cards**: Utilize `surface-container` with a 1rem corner radius. No shadows; use a subtle `outline-variant` for definition.
- **Input Fields**: Rectangular with a 0.25rem (Soft) radius to differentiate from pill-shaped buttons. Use **Bitter** for labels and placeholder text.
- **Chips/Labels**: Use `tertiary` or `primary-container` backgrounds. These are pill-shaped and use `label-sm` (**Bitter**) for metadata.
- **Lists**: Separated by `outline-variant` dividers. Ensure vertical padding of 16px+ to maintain the contemplative rhythm.
- **Icons**: Maintain an organic, hand-drawn style with soft, variable strokes. Avoid sharp geometric icons.
- **Feedback**: Errors use the `error` color, rendered in a medium weight of **Bitter** to ensure functional clarity.