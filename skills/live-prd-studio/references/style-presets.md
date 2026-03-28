# Style Presets

## Contents

- Preset model
- Token groups
- Suggested presets
- shadcn/ui mapping

## Preset Model

Represent a designer-approved style as one JSON file in `themes/`.

Recommended shape:

```json
{
  "name": "editorial-warm",
  "label": "Editorial Warm",
  "description": "Warm editorial surfaces with dense information hierarchy.",
  "tokens": {
    "radius": "1rem",
    "fontHeading": "\"Fraunces\", serif",
    "fontBody": "\"Inter\", sans-serif",
    "surface": "#fcf7f0",
    "surfaceAlt": "#f3e7d5",
    "text": "#1f1a17",
    "primary": "#9f4a22",
    "accent": "#d89052",
    "border": "#d5c1aa"
  }
}
```

## Token Groups

Keep theme fields small and semantic:

- `radius`
- `fontHeading`
- `fontBody`
- `surface`
- `surfaceAlt`
- `text`
- `muted`
- `primary`
- `accent`
- `border`
- `shadow`

Map them to CSS variables first. Let Tailwind and shadcn/ui consume the variables rather than hard-coding literal colors across components.

## Suggested Presets

- `editorial-warm`: rich storytelling, textured surfaces, softer borders.
- `fintech-clean`: cool neutrals, crisp borders, restrained depth.
- `playful-saas`: brighter accents, larger radius, lighter copy tone.

## shadcn/ui Mapping

Use the preset to drive:

- `:root` CSS variables
- Tailwind semantic color aliases
- shadcn/ui component defaults such as card surfaces, button emphasis, and input borders

Prefer this flow:

1. Parse preset JSON.
2. Emit CSS variables.
3. Expose variables in Tailwind config or theme layer.
4. Keep generated demos theme-aware by reading the same semantic tokens.
