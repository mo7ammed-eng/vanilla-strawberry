# Design System — Vanilla & Strawberry

## Art direction
Clean premium dessert editorial. Vanilla is the canvas; strawberry is the signature accent. Use product photography, whitespace, typography, and composition—not effects—to create quality.

## Color tokens

| Token | Value | Use |
|---|---|---|
| vanilla-50 | #FFF9F0 | Main page background |
| vanilla-0 | #FFFDF9 | Raised surfaces |
| strawberry-500 | #E94B62 | Primary actions and highlights |
| strawberry-700 | #C93650 | Hover/active emphasis |
| strawberry-100 | #F9DCE1 | Soft highlight backgrounds |
| vanilla-200 | #F1DFC2 | Warm accent |
| ink-900 | #292421 | Main text |
| ink-600 | #786F69 | Secondary text |
| border-warm | #EDE4DA | Borders/dividers |
| success | #397A5B | Success state |
| danger | #C93650 | Error state |

Implement tokens centrally using CSS variables and Tailwind theme integration. Do not scatter raw color values across components.

## Typography
Choose at most two font families:
- A distinctive but readable display face for selected headings.
- A highly legible UI/body face for paragraphs, controls, and dashboards.

Define a restrained type scale (display, h1, h2, h3, body, small, label). Avoid arbitrary sizes and oversized headings. Ensure Arabic/English fallback and line-height are considered if both languages are supported.

## Layout
- Use a consistent spacing scale.
- Set readable maximum text widths.
- Use a predictable responsive grid.
- Keep section spacing consistent.
- Let photography breathe.
- Avoid placing every section inside a card.

## Components
Define shared variants for buttons, inputs, cards, badges, dialogs, navigation, product tiles, empty states, and alerts. Every interactive component needs hover, focus, active, disabled, and loading states as relevant.

## Imagery
Use real project assets or properly licensed imagery. Optimize to modern formats and responsive sizes. Set dimensions/aspect ratios to avoid layout shift. Do not fabricate product claims or use unrelated images.

## Motion
Use subtle opacity/transform transitions. Respect reduced motion. Keep 3D as progressive enhancement with a static fallback. Never delay access to menu, product information, or checkout because an animation is loading.

## Quality bar
The result should feel clean, warm, premium, and easy to use. If an effect competes with the product, remove the effect.
