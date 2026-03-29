---
name: live-prd
description: Design and build living PRD workflows where AI helps product or design teams co-write Markdown PRDs, render them to HTML, and embed interactive shadcn/ui React + Vite demos or pages inside the document. Use when an AI tool needs to: turn chat notes into structured PRDs, keep Markdown as the source of truth, define a Markdown-to-HTML rendering engine, update a Bun-first CLI around PRD authoring, or generate themed shadcn/ui prototypes that render inside the published PRD.
---

# Live PRD Studio

## Overview

Enable a "live PRD" workflow: chat with AI, keep the canonical requirement in Markdown, publish it as HTML, and embed interactive product states directly in the document.

This skill is intended to live inside the project at `skills/live-prd/` so teams can version it alongside the codebase.

Prefer plain Markdown plus custom directives over MDX-first authoring so PDs can keep writing simple documents while engineering still gets runnable UI artifacts.

The skill is not complete when it only writes a Markdown PRD. Unless the user explicitly asks to stop at drafting, continue by launching or preparing the local preview so the PRD can be experienced as a live artifact, then move into validation and demo enrichment.

## Required Execution Contract

Treat this skill as an execution runbook, not a product overview.

- Prefer concrete local commands over abstract advice.
- Prefer the real CLI that exists in this repo over hypothetical future commands.
- Initialize projects with the real `live-prd init` CLI flow only.
- Never invent package names, scoped package names, or installation commands for the CLI.
- Do not suggest `npm install -g ...` unless the exact package name and distribution path are already explicitly known from the local project context.
- Do not use skill-local helper scripts for project initialization or validation.
- Do not create placeholder directory trees such as empty `apps/web`, `packages/cli`, `packages/engine`, `scripts`, or `demos` instead of a real CLI-initialized workspace.
- In initialized workspaces, user-facing files should stay at the root while the system layer is stored under `.live-prd/runtime/`.
- When the workspace state is unclear, inspect the filesystem before deciding what to do.
- When a command succeeds, immediately move to the next step in the workflow instead of stopping at a status report.
- The target outcome is not `a markdown file exists`.
- The target outcome is:
  `the user can edit a PRD, insert demos, and inspect the latest rendered HTML in the running Live PRD site`

## Workspace Decision Tree

Before acting, classify the current workspace into exactly one of these states:

1. Empty or not yet initialized as a Live PRD workspace.

- Missing core files such as `package.json`, `live-prd.config.json`, or `.live-prd/runtime/`.
- Use:
  `live-prd init <project-name>` if the CLI is already available on PATH
  or `npx live-prd init <project-name>` if the unscoped `live-prd` package is intentionally being used
  or, inside this repository,
  `node ./packages/cli/index.mjs init <project-name>`
- If none of those are actually available, stop and say the CLI is not available in the current environment.
- Do not guess a package like `@scope/live-prd`.
- Then continue with:
  `npm install`
  `npm run doctor`
  `npm run dev`

2. Initialized workspace, but dependencies are not installed or environment is not ready.

- Use:
  `npm install`
  `npm run doctor`
- Do not start PRD authoring until `doctor` is usable or you have explained the blocking issue.

3. Ready workspace, but no target PRD exists yet.

- Use:
  `npm run live-prd -- new <slug>`
- Then immediately continue with:
  `npm run dev`
- Then guide the user into the live editing loop.

4. Ready workspace with at least one PRD, but no demo inserted yet.

- Confirm the target PRD if there is more than one file under `docs/prd/`.
- Create a demo or page stub with:
  `npm run live-prd -- add-demo <name> --file docs/prd/<file>.md --after-heading "<heading>"`
  or
  `npm run live-prd -- add-page <name> --file docs/prd/<file>.md --after-heading "<heading>"`
- Keep `npm run dev` running so the user can inspect the result immediately.
- Do not manually create a brand-new file under `demos/` as the first step when `add-demo` or `add-page` can create it.

5. Ready workspace with PRD and demos already present.

- Keep the local authoring site running with:
  `npm run dev`
- Treat follow-up requests as an edit loop on the existing Markdown and demo files.

## Canonical CLI Recipes

Use these exact recipes when the user needs a working flow.

### Initialize a fresh project

```bash
live-prd init my-prd
cd my-prd
npm install
npm run doctor
npm run dev
```

### Create a new PRD inside an existing workspace

```bash
npm run live-prd -- new checkout-timeout-recovery
npm run dev
```

### Insert a component demo into a PRD

```bash
npm run live-prd -- add-demo retry-card --file docs/prd/checkout-timeout-recovery.md --after-heading "Live Demo"
```

### Insert a page demo into a PRD

```bash
npm run live-prd -- add-page checkout-recovery-page --file docs/prd/checkout-timeout-recovery.md --after-heading "Live Demo"
```

### Validate and build

```bash
npm run validate
npm run build
npm run preview
```

## Conversation Runbook

Follow this sequence when the user wants help authoring a live PRD.

1. Establish the workspace state.

- Inspect whether this is an initialized Live PRD workspace.
- Inspect how many PRDs already exist under `docs/prd/`.
- Inspect whether `demos/` already contains related files.

2. Run the next CLI step.

- Do not just describe the command if you can run it locally.
- If initialization is needed, use the real `live-prd init` path.
- If `live-prd` is missing, prefer the repo-local CLI path when you are inside the source repository.
- If no verified CLI path exists, explain that the CLI is unavailable instead of guessing how to install it.
- Prefer:
  `init -> install -> doctor -> dev`
  or
  `new -> dev`
  or
  `add-demo/add-page -> inspect in dev`

3. Put the user into the live loop.

- After `npm run dev` is started, explicitly tell the user:
  the preview stays open, local file edits refresh the rendered HTML, and they can keep chatting with AI to refine both PRD text and demos.

4. Continue with iterative edits.

- For requirement edits, update the target file under `docs/prd/*.md` first.
- If the user changes scope, copy, flows, states, acceptance criteria, rules, or business meaning, do not update only the demo; reflect the change in the canonical PRD Markdown.
- For UI proof points, update existing files under `demos/*.jsx`, and use `add-demo` or `add-page` for first-time file creation.
- When a request affects both product meaning and UI proof, update both the PRD Markdown and the related demo files in the same turn whenever feasible.
- After each edit, remind the user to inspect the refreshed preview.

5. Validate or build when appropriate.

- Run `npm run validate` after structural changes.
- Run `npm run build` or `npm run preview` when the user wants a shareable or production-style check.

## Multi-PRD Safety Rules

When there are multiple PRDs under `docs/prd/`, ambiguous follow-up edits must not be applied silently.

- Ambiguous examples:
  `continue`
  `modify this`
  `update the flow`
  `adjust the copy`
  `insert a demo`
- In those cases, confirm the target PRD first.
- Prefer a concise confirmation using the PRD slug or file path.
- Also mention the paired demo scope when useful, for example:
  `Should I update docs/prd/checkout-timeout-recovery.md and its related demos, or docs/prd/inventory-alert-prd.md?`
- Once a PRD is clearly active in the immediate conversation, continue using that PRD until the context changes.

## Response Pattern

When the skill completes a meaningful step, use this response shape:

1. Say what file or command was updated or started.
2. Say what the user should look at now.
3. Say the next most natural follow-up you can do.

Preferred examples:

- `Created docs/prd/checkout-timeout-recovery.md and started the local preview. Keep the preview open; I can now add the first demo after ## Live Demo.`
- `Inserted demos/retry-card.jsx into docs/prd/checkout-timeout-recovery.md. Check the running preview for the refreshed HTML, and I can refine the state copy next.`
- `There are two PRDs in docs/prd/. Which one should I update: checkout-timeout-recovery or inventory-alert-prd?`

## Operational Flow

Use this order when the user wants the skill to run the full product flow end to end.

1. Initialize the project.

- If a published companion CLI exists, prefer the CLI as the primary bootstrap path.
- Treat the CLI bootstrap as the first choice for users who start from an empty folder.
- Use:
  `live-prd init <project-name>`
  or `node ./packages/cli/index.mjs init <project-name>` inside this repository
- If that command is not available, do not fabricate a package install command.
- After bootstrap, confirm the workspace contains at least:
  `.live-prd/runtime`, `docs/prd`, `demos`, `themes`, `live-prd.config.json`

2. Install and verify the environment.

- Run dependency install in the initialized workspace.
- Prefer `npm install` unless the user explicitly wants Bun.
- Run `npm run doctor` immediately after install.
- Treat `doctor` as the default environment gate before continuing with PRD authoring or demo generation.

3. Start the local authoring site.

- Use `npm run dev` for active authoring.
- Use `npm run build` when the user wants a fresh production build.
- Use `npm run preview` when the user wants to inspect the built HTML output locally.
- When explaining the local workflow to the user, describe it as:
  `init -> install -> doctor -> dev -> build/preview`
- For `create a PRD` style requests inside a ready workspace, starting the local site is the default next action, not an optional suggestion.
- Prefer actually running `npm run dev` after the PRD is created when the environment allows it.
- After the site is running, explicitly invite the user to keep iterating in chat on both:
  `the PRD Markdown content` and `the embedded demos/pages`
- Tell the user that after each edit, the authoring preview updates and re-renders demos, so they can keep the browser open and inspect the latest HTML rendering there.

4. Generate or update the PRD.

- Create or update the canonical file under `docs/prd/*.md`.
- Keep Markdown as the source of truth.
- If the user asks to modify information, assume the canonical PRD Markdown must be updated unless they explicitly ask for a demo-only experiment.
- Use frontmatter plus stable section headings so later demo insertion can target headings precisely.
- After writing a new PRD, immediately start or prepare preview so the user can inspect the rendered result.
- Then decide whether the next highest-value action is:
  `generate a first demo` or `insert explicit demo markers for the next step`
- Do not stop with "here is your markdown" unless the user explicitly asked for markdown only.
- When preview is running, continue the conversation as an editing loop:
  `user requests a change -> update PRD and/or demo files -> tell the user to inspect the refreshed preview`

5. Generate demo or page code.

- Create component-level demos under `demos/*.jsx` or `demos/*.tsx`.
- Create page-level demos under `demos/*.jsx` or `demos/*.tsx` and use `:::live-page` when the artifact represents a full screen.
- Keep demo code focused on a specific product state, edge case, recovery state, or acceptance proof.
- When the workspace already has the CLI available, prefer:
  `npm run live-prd -- add-demo <name>`
  `npm run live-prd -- add-page <name>`
  and then replace the generated stub with the real implementation.
- For first-time demo or page creation, treat those CLI commands as required, not optional.
- Do not treat demo edits as sufficient when the underlying product requirement text also changed.

6. Insert the demo into the PRD.

- When the user asks for insertion, always identify the target position explicitly before editing the Markdown.
- Prefer these insertion modes in this order:
  `replace existing demo id`, `at explicit marker`, `after heading`, `before heading`
- Good examples:
  `Generate a retry demo and insert it after ## States and Edge Cases.`
  `Replace the demo with id retry-card.`
  `Insert the page demo at <!-- DEMO: checkout-recovery -->.`
- When inserting, generate both:
  the demo source file and the matching directive block.
- Use `:::live-demo` for components:

```md
:::live-demo
id: retry-card
source: demos/retry-card.jsx
height: 430
theme: editorial-warm
caption: Explain what this component proves.
:::
```

- Use `:::live-page` for full pages:

```md
:::live-page
id: checkout-recovery-page
source: demos/checkout-recovery-page.jsx
route: /playground/checkout-recovery
height: 840
theme: editorial-warm
caption: Explain what this page proves.
:::
```

7. Verify and share.

- Run `npm run validate` after structural PRD or directive edits.
- Run `npm run build` before handoff or shareable preview.
- Use the site export actions or generated build output when the user asks for HTML, Markdown, or demo bundle exports.
- If the user is actively authoring, prefer `npm run dev` or `npm run preview` and treat that as the expected continuation of PRD creation.
- If the PRD has no live demo yet, propose the next best action, for example:
  `The PRD is live in preview now. I can next generate a first demo or add a page-level flow to make it more inspectable.`
- When the user asks how to see the latest result, answer in project-native terms:
  keep the local preview open, edit the target PRD or demo file, and inspect the refreshed HTML rendering in the running site
- If a new demo path was created manually instead of through the CLI, run `npm run render` before expecting the preview to resolve it.

## Workflow

1. Decide the operating mode.

- Use `author` mode when the user mainly wants to turn notes or chat into a PRD.
- Use `prototype` mode when the user wants shadcn/ui demos or entire pages inserted into the document.
- Use `render` mode when the user already has Markdown and needs the engine, build pipeline, or HTML output.
- Use `system` mode when the user wants to evolve the repository, CLI, or theme system.

2. Keep Markdown as the source of truth.

- Store PRDs under `docs/prd/*.md`.
- Treat the source PRD file itself as canonical.
- Use frontmatter for metadata and stable slugs.
- Keep sections for background, user problem, scope, flows, edge cases, acceptance criteria, open questions, and linked demos.
- Create new PRDs with:
  `npm run live-prd -- new <slug>`
- When the user says `create a PRD`, assume they usually want a usable live PRD workflow, not a static file handoff.
- The default interpretation is: create the Markdown, then start the project so the rendered PRD can be viewed immediately.
- After creating the document, explicitly guide the next step with project-native actions such as:
  `inspect the live preview`, `add the first live demo`, `validate the document`, or `render a shareable build`
- If multiple PRDs exist under `docs/prd/`, treat follow-up instructions such as `continue`, `modify this`, `adjust the flow`, or `update the demo` as ambiguous unless the active PRD is already clear from the immediate context.
- In that case, confirm which PRD the user wants to edit before changing Markdown or demo files.
- Prefer confirming with the PRD slug or file path, and mention both the Markdown file and any affected demo file when clarifying scope.

3. Embed live UI with directives.

- Prefer `:::live-demo` for component-level examples and `:::live-page` for whole screens.
- Keep the directive body small and declarative: `id`, `source`, `theme`, `height`, and `route` when needed.
- Generate React/Vite code separately from the Markdown and link it from the directive.
- When the user asks to insert a demo at a specific position, prefer one of these targeting modes:
  `after heading`, `before heading`, `replace existing demo id`, or `at explicit marker` such as `<!-- DEMO: retry-card -->`.
- If the user does not specify placement precisely, ask for or infer the nearest section heading before inserting.
- If multiple PRDs are present and the target document is unclear, confirm the PRD before inserting or replacing any demo block.
- Read `references/markdown-spec.md` before changing the directive contract.

4. Render the PRD as HTML with hydrated islands.

- Convert Markdown to HTML with a remark/rehype-style pipeline.
- Replace live directives with placeholder nodes plus a manifest the runtime can hydrate.
- Use static export for sharing and a local authoring server for previewing local Markdown changes, managing comments, and exporting the current PRD or demo bundle.
- Read `references/architecture.md` before designing or modifying the engine.

5. Treat comments and annotations as part of the PRD source.

- Comments are stored inside the PRD Markdown file itself, in a hidden block at the end of the file:

```md
<!-- live-prd-comments
[
  {
    "id": "comment-123",
    "quote": "Retry succeeds on the next attempt.",
    "occurrence": 0,
    "body": "Clarify what user feedback appears during the retry.",
    "status": "open",
    "createdAt": "2026-03-29T10:20:00.000Z",
    "updatedAt": "2026-03-29T10:20:00.000Z",
    "resolvedAt": null
  }
]
-->
```

- Preserve this block when editing the PRD unless the user explicitly asks to remove comments.
- When the user asks to add a comment, append a new object instead of rewriting unrelated entries.
- When the user asks to close or resolve a comment, set `"status": "resolved"` and update `"resolvedAt"`.
- When the user asks to reopen a comment, set `"status": "open"` and clear `"resolvedAt"`.
- Use `"quote"` plus `"occurrence"` as the anchor back to the rendered HTML text.
- When the user asks AI to continue optimizing from comments, read this block first, summarize the open items, then update the PRD text and any affected demos together.

6. Treat shadcn/ui demos as requirement artifacts, not just mockups.

- Model the important happy path, edge states, loading states, and recovery states.
- Prefer small, explainable components over huge prototypes when the PRD only needs a stateful interaction proof.
- When the user asks for an inserted UI, generate both the TSX file and the matching directive block.
- Keep demo UIs inside the existing shadcn-style component system under the runtime UI layer, typically `.live-prd/runtime/apps/web/src/components/ui/`, whenever possible.
- Before adding a new UI primitive, check whether an equivalent local component already exists in the runtime UI layer.
- When a needed primitive does not exist yet, add a new local shadcn-style component file under the runtime UI layer and keep the API aligned with the existing `Button`, `Card`, and `Badge` patterns.
- Use the shared `cn` helper from the runtime UI layer when composing Tailwind class names inside UI primitives.
- Prefer relative imports that match the current file location, for example:
  `./components/ui/button.jsx`
  `./components/ui/card.jsx`
  `../components/ui/button.jsx`
- Do not assume this repo already has the upstream shadcn CLI wiring such as `components.json` or `npx shadcn add ...`.
- In this repo, "use shadcn/ui" means "preserve the same component architecture, styling conventions, and import locations", not "shell out to the official generator by default".
- If the user explicitly asks to add a missing shadcn-style primitive such as `dialog`, `popover`, `tabs`, or `sheet`, create the local component file, wire its imports, and keep the rest of the demo using that same local UI layer.
- When generating demos, avoid raw ad hoc buttons, badges, cards, dialogs, or popovers if a local UI component exists or should exist.

7. Map designer styles to a theme preset layer.

- Represent style variants as JSON presets that compile to CSS variables, Tailwind tokens, and shadcn/ui-friendly semantic colors.
- Keep presets reusable across multiple PRDs.
- Read `references/style-presets.md` before introducing new theme fields.

8. Prefer a Bun-first CLI design, but keep local scripts compatible with Node.

- Treat Bun as the default runtime for the future product CLI because it is fast and convenient for package management, scripting, and local dev.
- Keep scripts in this skill dependency-light so they can still run in environments where Bun is not installed yet.
- Prefer `live-prd init <project-name>` for bootstrap from an empty folder when the CLI is already available.
- Inside the source repository, prefer `node ./packages/cli/index.mjs init <project-name>`.
- If the CLI is not available, say so plainly and do not invent an install step.
- Once inside a generated workspace, prefer the local wrappers:
  `npm run doctor`
  `npm run dev`
  `npm run build`
  `npm run preview`
  `npm run live-prd -- <subcommand>`
- Before deeper setup or troubleshooting, prefer running `npm run doctor` or `node ./packages/cli/index.mjs doctor` to check runtime, directories, dependencies, and render validation.
- Read `references/cli-roadmap.md` when naming commands or shaping package boundaries.

## Output Rules

- Produce a Markdown PRD first, then the renderer or demo artifacts around it.
- Keep embedded UI references explicit and filesystem-based.
- Keep generated UI aligned to the PRD text; if the UI and text disagree, update both before handoff.
- Treat comments as durable PRD data. When editing Markdown, keep the `live-prd-comments` block valid JSON and avoid dropping existing comment metadata.
- CLI-initialized workspaces should expose user assets at the root and keep the system layer under `.live-prd/runtime/`.
- When the request is `create a PRD` or similar, finish by making the PRD viewable, not by returning a passive file dump.
- Preferred completion pattern:
  `1. say where the PRD was created`
  `2. start or prepare the local preview and say how to access it`
  `3. say whether validation was also run`
  `4. if helpful, offer to generate the first demo and insert it into the PRD`
- If the environment is available, proactively run the relevant local command instead of merely suggesting it.
- Once preview is running, keep the conversation grounded in the live loop:
  `I can keep updating this PRD and its demos here; refresh is automatic in the local preview.`
- If the workspace contains multiple PRDs, never silently assume a target PRD for an ambiguous follow-up edit.
- In those cases, briefly confirm:
  `Which PRD should I update: <slug-a> or <slug-b>?`

## Bundled Resources

- Use the real CLI commands for initialization, PRD creation, demo insertion, validation, build, and preview.
- Do not invoke skill-local helper scripts.
- Read `references/architecture.md`, `references/markdown-spec.md`, `references/style-presets.md`, and `references/cli-roadmap.md` only when the task needs those details.
