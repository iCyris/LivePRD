# CLI Roadmap

## Contents

- Why Bun-first
- Command surface
- Package boundaries
- Update strategy

## Why Bun-first

Prefer Bun for the eventual product CLI because it offers:

- fast local startup for scripts and dev commands
- built-in package management
- a good fit for monorepo utility commands
- one tool for `run`, `install`, and test workflows

Keep the skill's bundled scripts dependency-light so they still run with Node in environments that do not have Bun installed yet.

## Command Surface

Recommend this command family:

```text
live-prd init
live-prd chat
live-prd render
live-prd add demo
live-prd add page
live-prd theme list
live-prd theme apply
live-prd validate
live-prd upgrade
```

Command intent:

- `init`: scaffold the workspace
- `chat`: capture conversation notes and convert them into PRD drafts
- `render`: compile Markdown to HTML and build the runtime bundle
- `add demo`: create a demo component and insert the matching directive
- `add page`: create a full-page preview entry
- `theme *`: inspect or apply a designer preset
- `validate`: check Markdown and demo references
- `upgrade`: patch config, templates, and engine conventions

## Package Boundaries

- `packages/cli`: argument parsing and task orchestration
- `packages/engine`: Markdown parsing, manifest generation, HTML rendering
- `apps/web`: preview shell and published runtime

Keep business rules in `packages/engine` so both the CLI and any future web UI use the same pipeline.

## Update Strategy

Treat templates and presets as versioned assets:

- Make `upgrade` idempotent where possible.
- Prefer additive config migrations.
- Avoid scattering conventions across many hidden files.
- Keep `live-prd.config.json` small and explicit.
