---
name: Cuida Professional Ecosystem
colors:
  surface: '#f9faf7'
  surface-dim: '#d9dad8'
  surface-bright: '#f9faf7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f1'
  surface-container: '#edeeec'
  surface-container-high: '#e7e8e6'
  surface-container-highest: '#e2e3e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#404945'
  inverse-surface: '#2e3130'
  inverse-on-surface: '#f0f1ee'
  outline: '#717975'
  outline-variant: '#c0c8c4'
  surface-tint: '#396759'
  primary: '#154539'
  on-primary: '#ffffff'
  primary-container: '#2f5d50'
  on-primary-container: '#a3d4c3'
  inverse-primary: '#a0d1c0'
  secondary: '#7e5711'
  on-secondary: '#ffffff'
  secondary-container: '#ffc879'
  on-secondary-container: '#79520c'
  tertiary: '#5d322a'
  on-tertiary: '#ffffff'
  tertiary-container: '#784840'
  on-tertiary-container: '#fbbaaf'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bceddc'
  primary-fixed-dim: '#a0d1c0'
  on-primary-fixed: '#002019'
  on-primary-fixed-variant: '#204f42'
  secondary-fixed: '#ffddb1'
  secondary-fixed-dim: '#f3bd6f'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#624000'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#f7b7ac'
  on-tertiary-fixed: '#33110b'
  on-tertiary-fixed-variant: '#683a33'
  background: '#f9faf7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e0'
typography:
  headline-xl:
    fontFamily: Spectral
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
  headline-lg:
    fontFamily: Spectral
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-md:
    fontFamily: Spectral
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: system-ui
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: system-ui
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: system-ui
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter-sm: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin-page: 2rem
  column-span-12: 100%
---

## Brand & Style

This design system is crafted for the Cuida professional portal, an ecosystem designed to project calm, competence, and compassionate authority. The visual style bridges **Tactile / Skeuomorphic** warmth with **Minimalism**, relying on organic, warm paper-like tones and reassuring typography to evoke an immediate sense of trust and human-centric care. 

The emotional response is one of grounded reassurance, clarity, and quiet dignity. It avoids cold tech-forward aesthetics in favor of a restorative, premium environment tailored for professionals managing sensitive care workflows.

## Colors

The color palette is anchored by a warm, organic background (`#f7f4ee`) paired with pristine white surfaces (`#ffffff`) to create depth without harsh contrasts. 

- **Primary (Teal):** `#2f5d50` is reserved for high-intent primary actions, anchoring interactive focal points with a soothing, clinical yet warm authority.
- **Secondary (Neutral Accent):** `#b6873f` provides warm, sophisticated highlights and status indicators.
- **Neutrals:** Text utilizes deep earth tones (`#2a2118` for primary, `#7a6f5c` for secondary) to reduce eye strain, supported by a subtle border tone (`#e0d9c9`).
- **Feedback:** Errors and destructive actions are communicated through a restrained terracotta red (`#b3432f`).

## Typography

Typography establishes a deliberate contrast between literary warmth and utilitarian precision. **Spectral** is utilized exclusively for headlines in weights 500 (often in italics to add an approachable editorial grace), lending an empathetic and refined voice. **system-ui** powers all body, UI, and label text to guarantee maximum legibility and frictionless cross-platform rendering.

## Layout & Spacing

A **fluid grid** model structures the layout, ensuring content adapts gracefully across form factors while maintaining generous breathing room. 

- **Rhythm:** Built on an 8px foundational scale, translating to consistent spacing tiers (8px, 16px, 24px, 32px).
- **Adaptability:** On mobile devices, side margins collapse to 16px with single-column stacking. Tablets and desktops expand into a multi-column card layout with maximum container widths to prevent line lengths from exceeding optimal readability thresholds (approx. 70 characters).

## Elevation & Depth

Depth is handled through **low-contrast outlines** combined with subtle **tonal layers**. Because the design relies heavily on physical paper metaphors (`#f7f4ee` canvas with `#ffffff` cards), shadows are kept minimal. 

When elevation is required (e.g., modals, dropdowns, sticky action bars), use extremely soft, diffused ambient shadows tinted with the primary earth tone (`rgba(42, 33, 24, 0.06)`), paired with the signature border token (`#e0d9c9`) to define boundaries rather than relying solely on drop shadows.

## Shapes

The design system enforces a **pill-shaped** and highly rounded geometry (`roundedness: 3`). 
- Interactive elements such as buttons, badges, and input fields utilize full pill shapes (1rem to 9999px radius).
- Containers and cards use softer, generous corner radii (`1rem` to `1.5rem`) to maintain an inviting, tactile, and non-threatening aesthetic appropriate for a care ecosystem.

## Components

### Buttons
- **Primary:** Filled with `#2f5d50` (Teal), pill-shaped, text in white using `system-ui` medium weight. Generous horizontal padding for a grounded touch target.
- **Secondary:** Outlined with `#e0d9c9`, transparent background, text in `#2a2118`.
- **Hover/Active States:** Deepen the background or border by 10% on interaction.

### Chips & Badges
- Pill-shaped elements using soft neutral backgrounds (`#f7f4ee`) with `#7a6f5c` text for categorical tags. Use `#b6873f` sparingly for highlighted status badges.

### Input Fields & Controls
- **Inputs:** Pill-shaped or heavily rounded containers (`rounded-lg`), background `#ffffff`, bordered by `#e0d9c9`. Focus state shifts the border to `#2f5d50` with a subtle ring.
- **Checkboxes & Radios:** Clean geometric execution with `#2f5d50` selected states.

### Lists & Cards
- **Cards:** Pure white (`#ffffff`) surfaces resting on the `#f7f4ee` canvas, enclosed by a 1px border of `#e0d9c9`. Generous internal padding (`1.5rem`).
- **Lists:** Clean separation using thin `#e0d9c9` dividers with ample vertical rhythm.

### Ecosystem Specific Components
- **Patient/Client Summary Pill:** Compact contextual cards displaying vital care status with a left-accent color stripe.
- **Action Toolbar:** Floating or docked bottom bar for mobile workflows containing primary CTAs.