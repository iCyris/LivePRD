---
name: live-prd-studio
description: Design and build living PRD workflows where AI helps product or design teams co-write Markdown PRDs, render them to HTML, and embed interactive shadcn/ui React + Vite demos or pages inside the document. Use when Codex needs to: turn chat notes into structured PRDs, keep Markdown as the source of truth, define a Markdown-to-HTML rendering engine, scaffold or update a Bun-first CLI around PRD authoring, or generate themed shadcn/ui prototypes that render inside the published PRD.
---

# Live PRD Studio

## Overview

Enable a "live PRD" workflow: chat with AI, keep the canonical requirement in Markdown, publish it as HTML, and embed interactive product states directly in the document.

Prefer plain Markdown plus custom directives over MDX-first authoring so PDs can keep writing simple documents while engineering still gets runnable UI artifacts.

## Workflow

1. Decide the operating mode.

- Use `author` mode when the user mainly wants to turn notes or chat into a PRD.
- Use `prototype` mode when the user wants shadcn/ui demos or entire pages inserted into the document.
- Use `render` mode when the user already has Markdown and needs the engine, build pipeline, or HTML output.
- Use `system` mode when the user wants to scaffold or evolve the repository, CLI, or theme system.

2. Keep Markdown as the source of truth.

- Store PRDs under `docs/prd/*.md`.
- Use frontmatter for metadata and stable slugs.
- Keep sections for background, user problem, scope, flows, edge cases, acceptance criteria, open questions, and linked demos.
- Start from `assets/templates/example-prd.md` when creating a new document.

3. Embed live UI with directives.

- Prefer `:::live-demo` for component-level examples and `:::live-page` for whole screens.
- Keep the directive body small and declarative: `id`, `source`, `theme`, `height`, and `route` when needed.
- Generate React/Vite code separately from the Markdown and link it from the directive.
- Read `references/markdown-spec.md` before changing the directive contract.

4. Render the PRD as HTML with hydrated islands.

- Convert Markdown to HTML with a remark/rehype-style pipeline.
- Replace live directives with placeholder nodes plus a manifest the runtime can hydrate.
- Use static export for sharing and a dev server for authoring.
- Read `references/architecture.md` before designing or modifying the engine.

5. Treat shadcn/ui demos as requirement artifacts, not just mockups.

- Model the important happy path, edge states, loading states, and recovery states.
- Prefer small, explainable components over huge prototypes when the PRD only needs a stateful interaction proof.
- When the user asks for an inserted UI, generate both the TSX file and the matching directive block.

6. Map designer styles to a theme preset layer.

- Represent style variants as JSON presets that compile to CSS variables, Tailwind tokens, and shadcn/ui-friendly semantic colors.
- Keep presets reusable across multiple PRDs.
- Read `references/style-presets.md` before introducing new theme fields.

7. Prefer a Bun-first CLI design, but keep local scripts compatible with Node.

- Treat Bun as the default runtime for the future product CLI because it is fast and convenient for package management, scripting, and local dev.
- Keep scripts in this skill dependency-light so they can still run in environments where Bun is not installed yet.
- Read `references/cli-roadmap.md` when naming commands or shaping package boundaries.

## Output Rules

- Produce a Markdown PRD first, then the renderer or demo artifacts around it.
- Keep embedded UI references explicit and filesystem-based.
- Keep generated UI aligned to the PRD text; if the UI and text disagree, update both before handoff.
- When scaffolding a repository, prefer this shape: `apps/web`, `packages/engine`, `packages/cli`, `docs/prd`, `demos`, `themes`.

## Bundled Resources

- Use `scripts/scaffold_live_prd.mjs` to create a starter workspace with sample docs, demos, and theme files.
- Use `scripts/validate_live_prd_doc.mjs` to validate frontmatter and live directive blocks in a PRD Markdown file.
- Use `assets/templates/` for starter content.
- Read `references/architecture.md`, `references/markdown-spec.md`, `references/style-presets.md`, and `references/cli-roadmap.md` only when the task needs those details.
