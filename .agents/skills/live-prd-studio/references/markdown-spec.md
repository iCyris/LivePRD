# Markdown Spec

## Contents

- Frontmatter
- Required sections
- Live directives
- Validation rules

## Frontmatter

Use YAML frontmatter at the top of every PRD:

```yaml
---
title: Checkout Timeout Recovery
slug: checkout-timeout-recovery
owner: PD Team
status: draft
summary: Preserve cart context and guide recovery after checkout timeout.
theme: editorial-warm
reviewers:
  - Design
  - Frontend
---
```

Required fields:

- `title`
- `slug`
- `owner`
- `status`
- `summary`

Recommended fields:

- `theme`
- `reviewers`
- `related_links`
- `last_updated`

## Required Sections

Prefer this section order:

1. `## Background`
2. `## Problem`
3. `## Goals`
4. `## Non-Goals`
5. `## User Flow`
6. `## States and Edge Cases`
7. `## Live Demo`
8. `## Acceptance Criteria`
9. `## Open Questions`

## Live Directives

### Component demo

```md
:::live-demo
id: retry-card
source: demos/retry-card.tsx
height: 420
theme: editorial-warm
:::
```

Use `:::live-demo` for a bounded component or state-focused interaction.

Supported fields:

- `id`
- `source`
- `height`
- `theme`
- `caption`

### Full page

```md
:::live-page
id: checkout-recovery-page
source: demos/checkout-recovery-page.tsx
route: /playground/checkout-recovery
height: 760
theme: editorial-warm
:::
```

Use `:::live-page` when the requirement needs a full flow, layout, or routed screen.

Supported fields:

- `id`
- `source`
- `route`
- `height`
- `theme`
- `caption`

## Validation Rules

- Require frontmatter.
- Require `title`, `slug`, `owner`, `status`, and `summary`.
- Require at least one `## Acceptance Criteria` section.
- Require `id` and `source` on every live directive.
- Require `route` on `:::live-page`.
- Keep `source` relative to the project root so the engine can resolve it consistently.
