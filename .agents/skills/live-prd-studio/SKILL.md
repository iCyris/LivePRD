---
name: live-prd-studio
description: Design and build living PRD workflows where AI helps product or design teams co-write Markdown PRDs, render them to HTML, and embed interactive shadcn/ui React + Vite demos or pages inside the document. Use when an AI tool needs to: turn chat notes into structured PRDs, keep Markdown as the source of truth, define a Markdown-to-HTML rendering engine, scaffold or update a Bun-first CLI around PRD authoring, or generate themed shadcn/ui prototypes that render inside the published PRD.
---

# Live PRD Studio

## Overview

Enable a "live PRD" workflow: chat with AI, keep the canonical requirement in Markdown, publish it as HTML, and embed interactive product states directly in the document.

This skill is intended to live inside the project at `skills/live-prd-studio/` so teams can version it alongside the codebase.

Prefer plain Markdown plus custom directives over MDX-first authoring so PDs can keep writing simple documents while engineering still gets runnable UI artifacts.

## Operational Flow

Use this order when the user wants the skill to run the full product flow end to end.

1. Initialize the project.

- If a published companion CLI exists, prefer the CLI as the primary bootstrap path.
- Treat the CLI bootstrap as the first choice for users who start from an empty folder.
- Use:
  `npx live-prd init <project-name>`
- If no published CLI is available yet, fall back to the bundled scaffold script:
  `node ./skills/live-prd-studio/scripts/scaffold_live_prd.mjs <target-dir>`
- After bootstrap, confirm the workspace contains at least:
  `apps/web`, `packages/engine`, `packages/cli`, `docs/prd`, `demos`, `themes`, `live-prd.config.json`

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

4. Generate or update the PRD.

- Create or update the canonical file under `docs/prd/*.md`.
- Keep Markdown as the source of truth.
- Use frontmatter plus stable section headings so later demo insertion can target headings precisely.

5. Generate demo or page code.

- Create component-level demos under `demos/*.jsx` or `demos/*.tsx`.
- Create page-level demos under `demos/*.jsx` or `demos/*.tsx` and use `:::live-page` when the artifact represents a full screen.
- Keep demo code focused on a specific product state, edge case, recovery state, or acceptance proof.
- When the workspace already has the CLI available, prefer:
  `npm run live-prd -- add-demo <name>`
  `npm run live-prd -- add-page <name>`
  and then replace the scaffold with the real implementation.

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

## Workflow

1. Decide the operating mode.

- Use `author` mode when the user mainly wants to turn notes or chat into a PRD.
- Use `prototype` mode when the user wants shadcn/ui demos or entire pages inserted into the document.
- Use `render` mode when the user already has Markdown and needs the engine, build pipeline, or HTML output.
- Use `system` mode when the user wants to scaffold or evolve the repository, CLI, or theme system.

2. Keep Markdown as the source of truth.

- Store PRDs under `docs/prd/*.md`.
- Treat the source PRD file itself as canonical.
- Use frontmatter for metadata and stable slugs.
- Keep sections for background, user problem, scope, flows, edge cases, acceptance criteria, open questions, and linked demos.
- Start from `assets/templates/example-prd.md` when creating a new document.

3. Embed live UI with directives.

- Prefer `:::live-demo` for component-level examples and `:::live-page` for whole screens.
- Keep the directive body small and declarative: `id`, `source`, `theme`, `height`, and `route` when needed.
- Generate React/Vite code separately from the Markdown and link it from the directive.
- When the user asks to insert a demo at a specific position, prefer one of these targeting modes:
  `after heading`, `before heading`, `replace existing demo id`, or `at explicit marker` such as `<!-- DEMO: retry-card -->`.
- If the user does not specify placement precisely, ask for or infer the nearest section heading before inserting.
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

7. Map designer styles to a theme preset layer.

- Represent style variants as JSON presets that compile to CSS variables, Tailwind tokens, and shadcn/ui-friendly semantic colors.
- Keep presets reusable across multiple PRDs.
- Read `references/style-presets.md` before introducing new theme fields.

8. Prefer a Bun-first CLI design, but keep local scripts compatible with Node.

- Treat Bun as the default runtime for the future product CLI because it is fast and convenient for package management, scripting, and local dev.
- Keep scripts in this skill dependency-light so they can still run in environments where Bun is not installed yet.
- Prefer `npx live-prd init <project-name>` for bootstrap from an empty folder.
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
- When scaffolding a repository, prefer this shape: `apps/web`, `packages/engine`, `packages/cli`, `docs/prd`, `demos`, `themes`.

## Bundled Resources

- Use `scripts/scaffold_live_prd.mjs` to create a starter workspace with sample docs, demos, and theme files.
- Use `scripts/validate_live_prd_doc.mjs` to validate frontmatter and live directive blocks in a PRD Markdown file.
- Use `assets/templates/` for starter content.
- Read `references/architecture.md`, `references/markdown-spec.md`, `references/style-presets.md`, and `references/cli-roadmap.md` only when the task needs those details.
