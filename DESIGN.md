---
name: GynoApp
colors:
  surface: "#f9f9ff"
  surface-dim: "#cfdaf1"
  surface-bright: "#f9f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f0f3ff"
  surface-container: "#e7eeff"
  surface-container-high: "#dee8ff"
  surface-container-highest: "#d8e3fa"
  on-surface: "#111c2c"
  on-surface-variant: "#434653"
  inverse-surface: "#263142"
  inverse-on-surface: "#ebf1ff"
  outline: "#737784"
  outline-variant: "#c3c6d5"
  surface-tint: "#1d59c1"
  primary: "#003c90"
  on-primary: "#ffffff"
  primary-container: "#0f52ba"
  on-primary-container: "#bcceff"
  inverse-primary: "#b0c6ff"
  secondary: "#006a65"
  on-secondary: "#ffffff"
  secondary-container: "#76f3ea"
  on-secondary-container: "#006f69"
  tertiary: "#3a4248"
  on-tertiary: "#ffffff"
  tertiary-container: "#51595f"
  on-tertiary-container: "#c8cfd7"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#d9e2ff"
  primary-fixed-dim: "#b0c6ff"
  on-primary-fixed: "#001945"
  on-primary-fixed-variant: "#00419c"
  secondary-fixed: "#79f6ed"
  secondary-fixed-dim: "#59dad1"
  on-secondary-fixed: "#00201e"
  on-secondary-fixed-variant: "#00504c"
  tertiary-fixed: "#dce3eb"
  tertiary-fixed-dim: "#c0c7cf"
  on-tertiary-fixed: "#151c22"
  on-tertiary-fixed-variant: "#40484e"
  background: "#f9f9ff"
  on-background: "#111c2c"
  surface-variant: "#d8e3fa"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 16px
  gutter: 12px
---

## Brand & Style

The design system is engineered to project clinical excellence, absolute privacy, and empathetic care. The target audience—gynecologists and medical practitioners—requires an interface that minimizes cognitive load while reinforcing the security of sensitive patient data.

The design style is **Corporate / Modern** with a lean toward **Minimalism**. It prioritizes high legibility and a systematic "safety-first" aesthetic. Every interface element is designed to feel intentional and stable, utilizing generous whitespace to prevent data density from feeling overwhelming. Visual metaphors focus on "Containment" and "Clarity," using subtle structural frames and protective iconography (shields, locks) to communicate HIPAA-grade security without appearing hostile or overly industrial.

## Colors

The palette is rooted in medical professionalism. The **Primary Color** (Sapphire Blue) is used for critical actions and navigational anchors, signaling authority and trust. The **Secondary Color** (Light Sea Green/Teal) serves as an accent for wellness-related highlights and positive states.

A vast amount of **Clean White Space** is maintained using the Tertiary "Clinical Tint"—a very soft blue-white used for background layering to reduce eye strain during long shifts. Neutral tones are kept cool-grey to maintain a sterile but modern feel, avoiding the harshness of true black.

- **Primary:** Deep Sapphire (#0F52BA) for branding and primary CTAs.
- **Secondary:** Medical Teal (#20B2AA) for interactive accents and progress.
- **Surface:** Clinical White (#FFFFFF) and Soft Tint (#F0F7FF) for layering.
- **Security:** Use a dedicated Emerald Green for "Verified/Secure" states and a muted Slate for "Locked" states.

## Typography

The design system utilizes **Inter** exclusively to ensure maximum legibility across medical charts and patient records. The type scale is "Functional-First," prioritizing clear hierarchies so practitioners can scan information rapidly.

- **Headlines:** Set with slight negative letter-spacing to appear compact and authoritative.
- **Body Text:** Ample line height (1.5x) is applied to ensure readability of clinical notes.
- **Data Labels:** Small, semi-bold, and slightly tracked-out uppercase styles are used for metadata like timestamps or patient IDs to differentiate them from narrative text.
- **Mobile scaling:** Display sizes shrink by 12.5% on mobile to ensure header content does not push critical data below the fold.

## Layout & Spacing

This design system uses a **Fluid Grid** model based on a 4px baseline rhythm. For the mobile environment, a 4-column grid is standard, while tablet layouts expand to an 8-column system.

- **Margins:** 16px lateral margins are mandatory for all mobile screens to ensure tap targets don't hit the bezel.
- **Vertical Rhythm:** Sections are separated by 24px (lg) or 32px (xl) to maintain the "clean and airy" medical aesthetic.
- **Touch Targets:** All interactive elements maintain a minimum hit area of 44x44px, regardless of their visual size, to accommodate fast-paced clinical environments.

## Elevation & Depth

To convey security and organization, the design system utilizes **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Surfaces:** Patient records and charts sit on "Level 1" cards, which are defined by a 1px border in a pale blue-grey (#E2E8F0) rather than a shadow. This keeps the UI feeling flat, modern, and digital-native.
- **Active States:** Subtle, highly-diffused ambient shadows (Opacity 0.05, 8px Blur) are reserved only for floating action buttons or temporary modals to indicate they are "above" the clinical record.
- **Modals:** Use a heavy backdrop blur (12px) to focus the physician's attention on the task at hand, visually "locking" the background data for privacy.

## Shapes

The shape language is **Rounded**, striking a balance between clinical precision and a friendly, approachable bedside manner.

- **Base Radius:** 8px (0.5rem) for standard buttons and input fields.
- **Container Radius:** 16px (1rem) for patient cards and data modules.
- **Pill Shapes:** Used exclusively for status indicators (e.g., "Confirmed," "Scheduled") and toggle switches to distinguish them from actionable buttons.
- **Icons:** Should feature capped ends and rounded joins to match the UI's radius.

## Components

- **Buttons:** Primary buttons are solid Sapphire Blue with 8px rounded corners. Secondary buttons use a teal outline. "Secure Action" buttons (like 'Finalize Report') include a leading lock icon.
- **Input Fields:** Use a light grey fill with a bottom-stroke or full 1px border. Floating labels are preferred to keep context visible during data entry.
- **Cards:** Patient summaries are housed in white cards with a subtle 1px #E2E8F0 border. Headers within cards use the Tertiary soft blue tint as a background to separate the patient's name from their clinical data.
- **Chips/Status:** Use the Pill shape. "High Priority" chips use a soft red tint with dark red text, while "Routine" uses the secondary teal.
- **Privacy Shield:** A recurring component—a small badge or persistent icon in the header—that indicates "Encrypted Session Active," reinforcing the secure nature of the app.
- **Data Lists:** Use clean dividers (1px) with 16px padding. Avoid icons inside lists unless they represent a specific file type (e.g., PDF, Image) or a critical alert.
