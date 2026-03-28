#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  listThemes,
  loadConfig,
  renderCatalog,
  writeDistArtifacts,
  writeGeneratedModule,
} from "../engine/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

function printUsage() {
  console.log("live-prd <command> [args]");
  console.log("");
  console.log("Commands:");
  console.log("  validate [file]   Validate one PRD or all PRDs under docs/prd");
  console.log("  render [file]     Render one PRD or all PRDs into generated web data");
  console.log("  new <slug>        Create a new PRD markdown file");
  console.log("  add-demo <name>   Create a demo component stub under demos/");
  console.log("  add-page <name>   Create a page component stub under demos/");
  console.log("  theme-list        List all available theme presets");
  console.log("  theme-set <file> <theme>  Update a PRD frontmatter theme");
}

function toTitleCase(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function toPascalCase(value) {
  return value
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

async function writeFileIfMissing(filePath, contents) {
  try {
    await readFile(filePath, "utf8");
    throw new Error(`File already exists: ${filePath}`);
  } catch (error) {
    if (error?.code && error.code !== "ENOENT") {
      throw error;
    }
  }

  await writeFile(filePath, contents, "utf8");
}

async function createPrd(slug) {
  const config = await loadConfig(projectRoot);
  const title = toTitleCase(slug);
  const targetPath = path.join(projectRoot, config.contentDir, `${slug}.md`);
  const demoPath = path.join(projectRoot, "demos", `${slug}-demo.jsx`);
  const content = `---
title: ${title}
slug: ${slug}
owner: PD Team
status: draft
summary: Summarize the feature outcome here.
theme: ${config.defaultTheme}
reviewers:
  - Design
  - Frontend
---

# ${title}

## Background

Describe the business context.

## Problem

Describe the user problem.

## Goals

- Goal 1
- Goal 2

## Non-Goals

- Non-goal 1

## User Flow

1. Step 1
2. Step 2

## States and Edge Cases

- Edge case 1

## Live Demo

:::live-demo
id: ${slug}-demo
source: demos/${slug}-demo.jsx
height: 430
theme: ${config.defaultTheme}
caption: Explain what this demo proves.
:::

## Acceptance Criteria

- Criterion 1
- Criterion 2

## Open Questions

- Question 1
`;

  await writeFileIfMissing(targetPath, content);
  await writeFileIfMissing(
    demoPath,
    `import { Sparkles } from "lucide-react";

import { Button } from "../apps/web/src/components/ui/button.jsx";

export default function ${toPascalCase(slug)}Demo() {
  return (
    <section className="max-w-xl rounded-[var(--prd-radius)] border border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] p-6 shadow-[var(--prd-shadow)]">
      <div className="flex items-center gap-2 text-[color:var(--prd-primary)]">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Starter live demo</span>
      </div>
      <h3 className="mt-4 text-2xl leading-tight text-[color:var(--prd-text)]">
        Replace this stub with the key interaction for ${title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[color:var(--prd-muted)]">
        Keep the demo focused on the requirement state the team needs to align on.
      </p>
      <div className="mt-5">
        <Button>Primary action</Button>
      </div>
    </section>
  );
}
`,
  );
  console.log(`Created ${path.relative(projectRoot, targetPath)}`);
  console.log(`Created ${path.relative(projectRoot, demoPath)}`);
}

async function createDemo(name, isPage = false) {
  const pascalName = toPascalCase(name);
  const fileName = isPage ? `${name}.jsx` : `${name}.jsx`;
  const targetPath = path.join(projectRoot, "demos", fileName);
  const importLine = isPage
    ? 'import { Badge } from "../apps/web/src/components/ui/badge.jsx";'
    : 'import { Button } from "../apps/web/src/components/ui/button.jsx";';
  const contents = isPage
    ? `import { ArrowRight } from "lucide-react";

${importLine}

export default function ${pascalName}() {
  return (
    <main className="min-h-full bg-[color:var(--prd-surface)] p-8 text-[color:var(--prd-text)]">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <Badge className="bg-[color:color-mix(in_srgb,var(--prd-primary)_10%,white)] text-[color:var(--prd-primary)]">
            Live page
          </Badge>
          <h1 className="text-5xl leading-tight">Replace this headline with the page intent</h1>
          <p className="max-w-2xl text-lg leading-8 text-[color:var(--prd-muted)]">
            Describe the user story this page exists to validate.
          </p>
        </section>
        <section className="rounded-[var(--prd-radius)] border border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] p-6 shadow-[var(--prd-shadow)]">
          <div className="flex items-center gap-2 text-[color:var(--prd-primary)]">
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm font-medium">Replace this panel with the critical interaction</span>
          </div>
        </section>
      </div>
    </main>
  );
}
`
    : `import { Sparkles } from "lucide-react";

${importLine}

export default function ${pascalName}() {
  return (
    <section className="max-w-xl rounded-[var(--prd-radius)] border border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] p-6 shadow-[var(--prd-shadow)]">
      <div className="flex items-center gap-2 text-[color:var(--prd-primary)]">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Interactive proof point</span>
      </div>
      <h3 className="mt-4 text-2xl leading-tight text-[color:var(--prd-text)]">
        Replace this component stub with the state you want engineering to align on
      </h3>
      <p className="mt-3 text-sm leading-6 text-[color:var(--prd-muted)]">
        Keep the interaction focused on one requirement question.
      </p>
      <div className="mt-5">
        <Button>Primary action</Button>
      </div>
    </section>
  );
}
`;

  await writeFileIfMissing(targetPath, contents);
  console.log(`Created ${path.relative(projectRoot, targetPath)}`);
  console.log("");
  console.log(isPage ? "Directive snippet:" : "Directive snippet:");
  console.log("");
  console.log(isPage ? `:::live-page
id: ${name}
source: demos/${fileName}
route: /playground/${name}
height: 840
theme: editorial-warm
caption: Explain what this page demonstrates.
:::` : `:::live-demo
id: ${name}
source: demos/${fileName}
height: 430
theme: editorial-warm
caption: Explain what this component demonstrates.
:::`); 
}

async function setTheme(file, themeName) {
  const config = await loadConfig(projectRoot);
  const availableThemes = await listThemes(projectRoot, config);
  if (!availableThemes.includes(themeName)) {
    throw new Error(`Unknown theme "${themeName}". Available themes: ${availableThemes.join(", ")}`);
  }

  const absolutePath = path.resolve(projectRoot, file);
  const source = await readFile(absolutePath, "utf8");
  const nextSource = source.includes("\ntheme:")
    ? source.replace(/\ntheme:\s*.+\n/, `\ntheme: ${themeName}\n`)
    : source.replace(/^---\n([\s\S]*?)\n---\n/, (match, body) => `---\n${body}\ntheme: ${themeName}\n---\n`);

  await writeFile(absolutePath, nextSource, "utf8");
  console.log(`Updated theme for ${path.relative(projectRoot, absolutePath)} -> ${themeName}`);
}

async function run() {
  const [, , command, ...args] = process.argv;

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "new") {
    if (!args[0]) {
      throw new Error('Usage: live-prd new <slug>');
    }
    await createPrd(args[0]);
    return;
  }

  if (command === "add-demo") {
    if (!args[0]) {
      throw new Error('Usage: live-prd add-demo <name>');
    }
    await createDemo(args[0], false);
    return;
  }

  if (command === "add-page") {
    if (!args[0]) {
      throw new Error('Usage: live-prd add-page <name>');
    }
    await createDemo(args[0], true);
    return;
  }

  if (command === "theme-list") {
    const config = await loadConfig(projectRoot);
    const themes = await listThemes(projectRoot, config);
    for (const theme of themes) {
      console.log(theme);
    }
    return;
  }

  if (command === "theme-set") {
    if (!args[0] || !args[1]) {
      throw new Error('Usage: live-prd theme-set <file> <theme>');
    }
    await setTheme(args[0], args[1]);
    return;
  }

  if (command !== "validate" && command !== "render") {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }

  const { config, documents, issues } = await renderCatalog(projectRoot, args[0]);

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }

    if (command === "validate") {
      process.exit(1);
    }
  }

  if (command === "validate") {
    console.log(`Validated ${documents.length} PRD document(s).`);
    if (issues.length === 0) {
      console.log("No validation issues found.");
    }
    return;
  }

  await writeGeneratedModule(projectRoot, config, documents);
  await writeDistArtifacts(projectRoot, config, documents);

  console.log(`Rendered ${documents.length} PRD document(s).`);
  console.log(`Generated module: ${config.generatedModule}`);
  console.log(`Dist catalog: ${path.join(config.distDir, "catalog.json")}`);

  if (issues.length > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
