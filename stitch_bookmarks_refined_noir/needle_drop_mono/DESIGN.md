# Design System Document: Digital Vinyl & Editorial Sophistication

## 1. Overview & Creative North Star: "The Sonic Curator"
This design system is built to evoke the tactile, intentional experience of browsing a high-end vinyl collection. We are moving away from the "utility-first" SaaS aesthetic toward a **High-End Editorial** experience. 

The Creative North Star is **"The Sonic Curator."** The UI should feel like a premium music journal—spacious, authoritative, and warm. We achieve this by breaking the rigid, boxed-in layouts of traditional apps in favor of intentional asymmetry, cinematic imagery, and a "tonal layering" approach to depth. Every interaction should feel like a "needle drop": precise, analog, and soul-stirring.

---

## 2. Colors & Surface Philosophy
The palette is a sophisticated transition from deep, ink-like blacks to tobacco and espresso tones. This isn't just a "dark mode"; it is a curated atmosphere.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined through **Background Color Shifts**. To separate a sidebar from a main feed, transition from `surface` (#131313) to `surface-container-low` (#1C1B1B). This creates a seamless, "molded" look rather than a stitched-together one.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following tiers to define importance:
- **Base Layer:** `surface` (#131313)
- **Secondary Sections:** `surface-container` (#201F1F)
- **Interactive Cards:** `surface-container-high` (#2A2A2A)
- **Floating Overlays:** `surface-container-highest` (#353534)

### The "Glass & Gradient" Rule
To prevent the UI from feeling "flat" or "muddy," use **Glassmorphism** for floating headers and navigation bars. Use a semi-transparent `surface-container` with a `backdrop-blur` of 20px. 
*   **Signature Texture:** For primary CTAs, use a subtle radial gradient transitioning from `secondary` (#E6BEAD) to `tertiary` (#5C4033) to provide a soft, metallic sheen reminiscent of a vinyl record's reflection.

---

## 3. Typography: The Editorial Voice
Our type pairing mimics a high-fashion masthead: the intellectual serif meets the functional sans-serif.

*   **Display & Headlines (Public Sans):** Use for artist names, album titles, and section headers. Public Sans brings a literary, "archival" quality.
    *   *Strategy:* Use `display-lg` (3.5rem) with tighter letter-spacing (-0.02em) for hero moments to create high-impact "magazine" layouts.
*   **Titles & Body (Manrope):** Use for metadata, descriptions, and functional UI labels. Manrope provides the modern, "tech-forward" balance to the sans-serif.
    *   *Strategy:* Keep `body-md` (0.875rem) with generous line-height (1.6) to maintain readability against the dark backgrounds.

---

## 4. Elevation & Depth
In this design system, depth is a result of light and material, not artificial lines.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` (#0E0E0E) card sitting on a `surface-container-low` (#1C1B1B) section creates a recessed, "carved-out" look. 
*   **Ambient Shadows:** For floating elements (menus/modals), use ultra-diffused shadows. 
    *   *Token:* `box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);` 
    *   The shadow should never be pure grey; it must feel like an occlusion of the warm background.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` (#504440) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Cards & Lists
*   **The Divider Ban:** Never use horizontal lines to separate list items. Use the **Spacing Scale** (specifically `spacing.6` or `spacing.8`) to create breathing room, or alternate background tints between `surface` and `surface-container-low`.
*   **Media-Heavy:** Album art should always use the `xl` (0.75rem) corner radius. Imagery is the star; the UI is the frame.

### Buttons
*   **Primary:** Fill with `primary` (#CEC5BA), text in `on_primary` (#353028). Corner radius: `full`.
*   **Secondary:** Ghost style. No fill, `outline` (#9C8E88) at 20% opacity. Text in `primary`.
*   **Tertiary:** Text only using `secondary` (#E6BEAD) for a sophisticated "pop" of warmth.

### Input Fields
*   Avoid the "box" look. Use a `surface-container-highest` background with a bottom-only `outline` of 1px at 10% opacity. This feels more like a signature line in a guestbook than a form.

### Signature Component: The "Now Playing" Bar
*   Utilize **Glassmorphism** (semi-transparent `surface-container` + blur). 
*   Progress bars should use `secondary` (#E6BEAD) for the active state and `surface-container-highest` for the track, avoiding high-contrast whites.

---

## 6. Do's and Don'ts

### Do:
*   **Use Intentional Asymmetry:** Offset album art from text to create an editorial feel.
*   **Embrace Negative Space:** If a screen feels crowded, double the spacing token. High-end design requires room to breathe.
*   **Layer with Purpose:** Always ensure your `surface` nesting follows a logical light-source (darker elements "recede," lighter elements "hover").

### Don't:
*   **Don't use 100% White:** Use `on_surface` (#E5E2E1). Pure white (#FFFFFF) is too harsh for the "warm tobacco" palette and ruins the analog feel.
*   **Don't use standard icons:** Use "light" or "thin" weight iconography to match the elegance of Public Sans.
*   **Don't use hard corners:** Except for the screen edges, avoid `none` roundedness. Use `md` (0.375rem) for small elements and `xl` (0.75rem) for large containers to maintain a soft, premium touch.