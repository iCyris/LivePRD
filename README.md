# Live PRD Studio

Live PRD Studio is a single CLI product for living PRDs: initialize a workspace, keep Markdown as the source of truth, embed runnable `shadcn/ui + React + Vite` demos, and render the result into a richer HTML requirement artifact.

## Core Model

- `docs/prd/*.md` stays the source of truth.
- The web app is a one-way renderer: switch among local PRDs, preview them, and export what you see.
- `:::live-demo` and `:::live-page` embed runnable UI proof points inside Markdown.
- `demos/*.jsx` contains the React artifacts referenced by the PRD.
- The bundled skill teaches an AI tool how to create PRDs and demos while staying inside the project structure.

## Requirements

- Node.js
- npm
- Bun is optional but recommended

## Published CLI Workflow

Initialize a fresh workspace:

```bash
npx live-prd init my-prd
cd my-prd
npm install
npm run doctor
npm run dev
```

Common follow-up commands:

```bash
npm run live-prd -- new checkout-timeout-recovery
npm run live-prd -- add-demo retry-card --file docs/prd/product-requirements.md --marker primary
npm run live-prd -- add-page checkout-recovery-page --file docs/prd/product-requirements.md --after-heading "Live Demo"
npm run validate
npm run build
npm run preview
```

Upgrade the system layer safely:

```bash
npm run live-prd -- upgrade check
npm run live-prd -- upgrade apply --dry-run
npm run live-prd -- upgrade apply
npm run live-prd -- upgrade rollback <backup-id>
```

Install the bundled skill bundle:

```bash
npm run skill:install
```

By default this installs into the current project's `.agents/skills/`.

If your AI tool uses a different skills directory:

```bash
npm run skill:install -- --target /path/to/your/tool/skills
```

Create a local release bundle:

```bash
npm run release:local
```

## Local Repository Workflow

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

## How AI Inserts Demos

Ask the skill to generate both the React file and the directive block, and specify the insertion target clearly:

- `Generate a retry demo and insert it after ## States and Edge Cases.`
- `Replace the demo with id retry-card.`
- `Insert a page demo at <!-- DEMO: checkout-recovery -->.`

The CLI can scaffold the file and insert the directive block at a marker, heading, or existing demo id:

```md
:::live-demo
id: retry-card
source: demos/retry-card.jsx
height: 430
theme: editorial-warm
caption: Explain what this component demonstrates.
:::
```

## Publish Workflow

1. Run `npm run doctor`.
2. Run `npm run build`.
3. Run `npm run release:local`.
4. Share the generated folder under `dist/release/`.
5. Ask teammates to run `npm install`, `npm run doctor`, and `npm run skill:install`.

## Repository Layout

- `apps/web`: local Markdown preview and export UI
- `packages/engine`: markdown rendering and PRD runtime engine
- `packages/cli`: internal CLI implementation
- `docs/prd`: canonical PRD Markdown files
- `demos`: runnable React demos and pages
- `themes`: theme presets
- `skills/live-prd-studio`: bundled AI skill

## Upgrade Safety

- `.live-prd/manifest.json` tracks system-managed files.
- `.live-prd/backups/<timestamp>/` stores automatic upgrade backups.
- `docs/prd/**`, `demos/**`, and user-authored content stay user-owned and are not overwritten by system upgrades.
- `package.json` and `live-prd.config.json` are merged conservatively during upgrade instead of being blindly replaced.
