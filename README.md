# Live PRD Studio

Live PRD Studio is a single CLI product for living PRDs: initialize a workspace, co-write Markdown specs with AI, embed runnable `shadcn/ui + React + Vite` demos, and publish the result as a richer HTML requirement artifact.

## Core Model

- `docs/prd/*.md` stays the source of truth.
- `:::live-demo` and `:::live-page` embed runnable UI proof points inside Markdown.
- `demos/*.jsx` contains the React artifacts referenced by the PRD.
- `docs/prd/.versions/` stores named local Markdown versions.
- `skills/live-prd-studio/SKILL.md` teaches an AI tool how to drive the workflow end to end.

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
npm run live-prd -- add-demo retry-card
npm run live-prd -- add-page checkout-recovery-page
npm run validate
npm run build
npm run preview
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

The CLI can scaffold the file, while the skill updates the PRD Markdown:

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

- `apps/web`: authoring and preview UI
- `packages/engine`: markdown rendering and PRD/version engine
- `packages/cli`: internal CLI implementation
- `docs/prd`: canonical PRD Markdown files
- `docs/prd/.versions`: local named Markdown versions
- `demos`: runnable React demos and pages
- `themes`: theme presets
- `skills/live-prd-studio`: bundled AI skill
