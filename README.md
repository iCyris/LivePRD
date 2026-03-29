# Live PRD Studio

Live PRD Studio is a single CLI product for living PRDs: initialize a workspace, keep Markdown as the source of truth, embed runnable `shadcn/ui + React + Vite` demos, and render the result into a richer HTML requirement artifact.

## Core Model

- `docs/prd/*.md` stays the source of truth.
- `demos/*.jsx` contains the React artifacts referenced by the PRD.
- When a requirement changes, update the PRD Markdown first and then sync any affected demo code.
- `:::live-demo` and `:::live-page` embed runnable UI proof points inside Markdown.
- In initialized workspaces, user-facing files stay at the root while the system runtime lives under `.live-prd/runtime/`.
- The bundled skill helps AI tools stay inside the intended PRD and demo workflow.

## Requirements

- Node.js
- npm
- Bun is optional but recommended

## Quick Start

Create a fresh workspace:

```bash
live-prd init my-prd
cd my-prd
npm install
npm run doctor
npm run dev
```

Common follow-up commands:

```bash
npm run live-prd -- new checkout-timeout-recovery
npm run live-prd -- add-demo retry-card --file docs/prd/checkout-timeout-recovery.md --after-heading "Live Demo"
npm run live-prd -- add-page checkout-recovery-page --file docs/prd/checkout-timeout-recovery.md --after-heading "Live Demo"
npm run validate
npm run build
npm run preview
```

## Initialized Workspace

After `live-prd init`, the user-facing workspace is intentionally small:

- `docs/prd/`
- `demos/`
- `themes/`
- `live-prd.config.json`
- `package.json`
- `AGENTS.md`

The product runtime itself is stored under `.live-prd/runtime/`.

## Structure Guide

There are two structures to keep in mind:

### Product Repository Structure

- `apps/web`: internal preview app and runtime UI
- `apps/web/src/runtime-generated`: runtime-facing generated entrypoints
- `packages/cli`: internal CLI source
- `packages/engine`: internal markdown/rendering engine
- `skills/live-prd`: AI guidance

### Initialized Workspace Structure

- `docs/prd/`: user-authored PRD markdown
- `demos/`: user-authored demo modules
- `themes/`: user-selectable theme presets
- `.live-prd/runtime/`: hidden system layer managed by the CLI
- `.live-prd/generated/`: workspace-side generated artifacts

## AI Workflow

When someone asks the bundled skill to create or update a PRD, the expected flow is:

- Inspect workspace state first, then use the real CLI path such as `init`, `new`, `add-demo`, or `add-page`.
- Start or prepare `npm run dev` so the rendered PRD is visible.
- Keep iterating on both PRD Markdown and demos in chat.
- Confirm the target PRD before ambiguous follow-up edits when multiple PRDs exist.

Example prompts:

- `Generate a retry demo and insert it after ## States and Edge Cases.`
- `Replace the demo with id retry-card.`
- `Insert a page demo at <!-- DEMO: checkout-recovery -->.`

## Local Development

If you are working inside this repository before publishing:

```bash
npm install
npm run doctor
npm run dev
```

The npm scripts are thin wrappers over the same CLI:

```bash
npm run validate
npm run render
npm run build
npm run preview
npm run skill:install
npm run release:local
```

## Skill Install

Install the bundled skill bundle:

```bash
npm run skill:install
```

By default this installs into the current project's `.agents/skills/`.

If your AI tool uses a different skills directory:

```bash
npm run skill:install -- --target /path/to/your/tool/skills
```

## System Updates

Upgrade the system layer safely:

```bash
npm run live-prd -- upgrade check
npm run live-prd -- upgrade apply --dry-run
npm run live-prd -- upgrade apply
npm run live-prd -- upgrade rollback <backup-id>
```

Create a local release bundle:

```bash
npm run release:local
```

## Publish Workflow

1. Run `npm run doctor`.
2. Run `npm run build`.
3. Run `npm run release:local`.
4. Share the generated folder under `dist/release/`.
5. Ask teammates to run `npm install`, `npm run doctor`, and `npm run skill:install`.

## Repository Layout

For day-to-day development in this repository, the main internal areas are:

- `apps/web`
- `packages/cli`
- `packages/engine`
- `skills/live-prd`

Sample user-facing content in this repository lives under:

- `docs/prd`
- `demos`
- `themes`

## Upgrade Safety

- `.live-prd/manifest.json` tracks system-managed files.
- `.live-prd/backups/<timestamp>/` stores automatic upgrade backups.
- `docs/prd/**`, `demos/**`, and user-authored content stay user-owned and are not overwritten by system upgrades.
- `package.json` and `live-prd.config.json` are merged conservatively during upgrade instead of being blindly replaced.
