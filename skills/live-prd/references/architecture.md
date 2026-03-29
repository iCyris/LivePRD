# Live PRD Architecture

## Contents

- Goals
- Repository shape
- Rendering pipeline
- Demo runtime
- Authoring modes
- Why directives over MDX

## Goals

- Keep Markdown as the editable source of truth for PMs and PDs.
- Publish a rich HTML document for engineering, design, and review.
- Support embedded interactive demos without forcing authors to write JSX inline.
- Make the system easy to evolve through a CLI.

## Repository Shape

Prefer this monorepo layout:

```text
live-prd/
  apps/
    web/                 # Vite app for authoring preview and published HTML runtime
  packages/
    engine/              # Markdown parser, manifest builder, HTML renderer
    cli/                 # Bun-first CLI wrapping common workflows
  docs/
    prd/                 # Canonical markdown PRDs
  demos/                 # Generated or hand-authored React demo components/pages
  themes/                # JSON design presets
  live-prd.config.json   # Shared configuration
```

## Rendering Pipeline

1. Read Markdown and frontmatter from `docs/prd/*.md`.
2. Parse custom directive blocks such as `:::live-demo` and `:::live-page`.
3. Convert Markdown to HTML AST.
4. Replace each live directive with a mount node:

```html
<section
  class="prd-live-demo"
  data-live-kind="demo"
  data-live-id="retry-card"
  data-live-source="demos/retry-card.tsx"
></section>
```

5. Emit a manifest JSON file describing every live block.
6. Let the Vite runtime import the referenced React modules and hydrate each mount node as an island.
7. Export a static HTML bundle for review and keep a hot-reload preview in local dev.

## Demo Runtime

Use a registry layer between the manifest and React imports:

- The manifest stays content-focused.
- The registry resolves `source` entries to actual modules.
- The runtime can render each block in isolation and apply a selected theme preset.

Recommended runtime behavior:

- Render missing demos as visible warnings in dev.
- Fail the build on missing demos in CI.
- Isolate full-page previews inside a responsive frame or routed preview shell.

## Authoring Modes

- `author`: mostly write or revise Markdown.
- `prototype`: generate or update `demos/*.tsx` and directive blocks.
- `render`: focus on the engine, manifest, and export pipeline.
- `system`: change repo structure, CLI, theme presets, or build orchestration.

## Why Directives Over MDX

Prefer plain Markdown plus directives as the default because:

- PMs and PDs can keep writing normal Markdown.
- Review diffs stay easier to scan.
- Structured directives are simpler to validate and convert into manifests.
- React remains available where it belongs: in the demo files.

Upgrade to MDX only when the user explicitly needs inline JSX composition inside the PRD itself.
