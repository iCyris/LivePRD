#!/usr/bin/env node

import { access, cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { execFile as execFileCallback, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { runInstallSkill } from "../../scripts/install-skill.mjs";
import { runReleaseLocal } from "../../scripts/release-local.mjs";

import {
  listThemes,
  loadConfig,
  renderCatalog,
  writeDistArtifacts,
  writeGeneratedModule,
} from "../engine/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "../..");
const execFile = promisify(execFileCallback);
const workspaceRoot = process.cwd();

function printUsage() {
  console.log("live-prd <command> [args]");
  console.log("");
  console.log("Commands:");
  console.log("  init <dir>        Scaffold a new live PRD workspace");
  console.log("  validate [file]   Validate one PRD or all PRDs under docs/prd");
  console.log("  render [file]     Render one PRD or all PRDs into generated web data");
  console.log("  dev               Render then start the local authoring site");
  console.log("  build             Render then build the production site");
  console.log("  preview           Preview the built site locally");
  console.log("  new <slug>        Create a new PRD markdown file");
  console.log("  add-demo <name>   Create a demo component stub under demos/");
  console.log("  add-page <name>   Create a page component stub under demos/");
  console.log("  skill-install     Install the bundled skill bundle for an AI tool");
  console.log("  release-local     Create a local release bundle under dist/release");
  console.log("  theme-list        List all available theme presets");
  console.log("  theme-set <file> <theme>  Update a PRD frontmatter theme");
  console.log("  doctor            Check local environment and project health");
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
  const config = await loadConfig(workspaceRoot);
  const title = toTitleCase(slug);
  const targetPath = path.join(workspaceRoot, config.contentDir, `${slug}.md`);
  const demoPath = path.join(workspaceRoot, "demos", `${slug}-demo.jsx`);
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
  console.log(`Created ${path.relative(workspaceRoot, targetPath)}`);
  console.log(`Created ${path.relative(workspaceRoot, demoPath)}`);
}

async function createDemo(name, isPage = false) {
  const pascalName = toPascalCase(name);
  const fileName = isPage ? `${name}.jsx` : `${name}.jsx`;
  const targetPath = path.join(workspaceRoot, "demos", fileName);
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
  console.log(`Created ${path.relative(workspaceRoot, targetPath)}`);
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
  const config = await loadConfig(workspaceRoot);
  const availableThemes = await listThemes(workspaceRoot, config);
  if (!availableThemes.includes(themeName)) {
    throw new Error(`Unknown theme "${themeName}". Available themes: ${availableThemes.join(", ")}`);
  }

  const absolutePath = path.resolve(workspaceRoot, file);
  const source = await readFile(absolutePath, "utf8");
  const nextSource = source.includes("\ntheme:")
    ? source.replace(/\ntheme:\s*.+\n/, `\ntheme: ${themeName}\n`)
    : source.replace(/^---\n([\s\S]*?)\n---\n/, (match, body) => `---\n${body}\ntheme: ${themeName}\n---\n`);

  await writeFile(absolutePath, nextSource, "utf8");
  console.log(`Updated theme for ${path.relative(workspaceRoot, absolutePath)} -> ${themeName}`);
}

async function runCommand(command, args, cwd = workspaceRoot) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function runRender(targetFile = null) {
  const { config, documents, issues } = await renderCatalog(workspaceRoot, targetFile);

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
  }

  await writeGeneratedModule(workspaceRoot, config, documents);
  await writeDistArtifacts(workspaceRoot, config, documents);

  console.log(`Rendered ${documents.length} PRD document(s).`);
  console.log(`Generated module: ${config.generatedModule}`);
  console.log(`Dist catalog: ${path.join(config.distDir, "catalog.json")}`);

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

async function runViteCommand(mode, extraArgs = []) {
  const viteBin = path.join(workspaceRoot, "node_modules", "vite", "bin", "vite.js");
  const viteConfig = path.join(workspaceRoot, "apps", "web", "vite.config.mjs");

  if (!(await pathExists(viteBin))) {
    throw new Error("Vite is not installed in this workspace. Run npm install or bun install first.");
  }

  if (mode === "dev" || mode === "build") {
    await runRender();
  }

  const args =
    mode === "dev"
      ? [viteBin, "--config", viteConfig, ...extraArgs]
      : [viteBin, mode, "--config", viteConfig, ...extraArgs];

  await runCommand(process.execPath, args);
}

async function copyStarterEntry(sourcePath, targetPath) {
  await cp(sourcePath, targetPath, {
    recursive: true,
    filter: (currentSource) => {
      const relative = path.relative(packageRoot, currentSource).split(path.sep).join("/");

      if (!relative) {
        return true;
      }

      if (
        relative.startsWith("dist/") ||
        relative.startsWith(".git/") ||
        relative.startsWith("node_modules/") ||
        relative === "docs/prd/.versions" ||
        relative.startsWith("docs/prd/.versions/")
      ) {
        return false;
      }

      return true;
    },
  });
}

async function initWorkspace(targetDir) {
  const absoluteTarget = path.resolve(workspaceRoot, targetDir);
  await mkdir(absoluteTarget, { recursive: true });

  const existingEntries = await readdir(absoluteTarget).catch(() => []);
  if (existingEntries.length > 0) {
    throw new Error(`Target directory is not empty: ${absoluteTarget}`);
  }

  const entries = [
    "apps",
    "packages",
    "scripts",
    "skills",
    "themes",
    "docs/prd",
    "demos",
    "live-prd.config.json",
  ];

  for (const entry of entries) {
    await copyStarterEntry(path.join(packageRoot, entry), path.join(absoluteTarget, entry));
  }

  const rootPackageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  rootPackageJson.name = path.basename(absoluteTarget);
  rootPackageJson.private = true;
  delete rootPackageJson.bin;
  delete rootPackageJson.files;

  await writeFile(
    path.join(absoluteTarget, "package.json"),
    `${JSON.stringify(rootPackageJson, null, 2)}\n`,
    "utf8",
  );

  await writeFile(
    path.join(absoluteTarget, "README.md"),
    `# ${path.basename(absoluteTarget)}\n\nGenerated with live-prd.\n\n## Quick Start\n\n\`\`\`bash\nnpm install\nnpm run doctor\nnpm run dev\n\`\`\`\n`,
    "utf8",
  );

  console.log(`Initialized live PRD workspace at ${absoluteTarget}`);
  console.log("Next steps:");
  console.log(`- cd ${absoluteTarget}`);
  console.log("- npm install");
  console.log("- npm run doctor");
  console.log("- npm run dev");
}

function ok(label, detail = "") {
  console.log(`OK   ${label}${detail ? ` - ${detail}` : ""}`);
}

function warn(label, detail = "") {
  console.log(`WARN ${label}${detail ? ` - ${detail}` : ""}`);
}

function fail(label, detail = "") {
  console.log(`FAIL ${label}${detail ? ` - ${detail}` : ""}`);
}

function section(title) {
  console.log(title);
}

async function pathExists(targetPath) {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fileCount(targetPath, predicate) {
  const entries = await readdir(targetPath, { withFileTypes: true });
  return entries.filter(predicate).length;
}

async function detectCommandVersion(command, args = ["--version"]) {
  try {
    const { stdout, stderr } = await execFile(command, args, { cwd: workspaceRoot });
    return (stdout || stderr).trim().split("\n")[0];
  } catch {
    return null;
  }
}

async function runDoctor() {
  const config = await loadConfig(workspaceRoot);
  const packageJson = JSON.parse(await readFile(path.join(workspaceRoot, "package.json"), "utf8"));
  const results = [];
  const nextSteps = [];

  const record = (level, label, detail = "", fix = "") => {
    results.push({ level, label, detail, fix });
    if (level === "ok") {
      ok(label, detail);
      return;
    }
    if (level === "warn") {
      warn(label, detail);
      if (fix) {
        nextSteps.push(fix);
      }
      return;
    }
    if (fix) {
      nextSteps.push(fix);
    }
    fail(label, detail);
  };

  console.log("Live PRD Doctor");
  console.log("");

  section("Runtime");
  record("ok", "Workspace", workspaceRoot);
  record("ok", "Node.js", process.version);

  const npmVersion = await detectCommandVersion("npm");
  if (npmVersion) {
    record("ok", "npm", npmVersion);
  } else {
    record("warn", "npm", "Not found in PATH.", "Install Node.js with npm available in PATH.");
  }

  const bunVersion = await detectCommandVersion("bun");
  if (bunVersion) {
    record("ok", "bun", bunVersion);
  } else {
    record("warn", "bun", "Not found. Bun is recommended but not required.", "Optional: install Bun for the Bun-first workflow.");
  }

  console.log("");
  section("Project Shape");

  const requiredPaths = [
    { label: "Config file", target: path.join(workspaceRoot, "live-prd.config.json"), kind: "file" },
    { label: "Content directory", target: path.join(workspaceRoot, config.contentDir), kind: "dir" },
    { label: "Demo directory", target: path.join(workspaceRoot, config.demoDir), kind: "dir" },
    { label: "Theme directory", target: path.join(workspaceRoot, config.themeDir), kind: "dir" },
    { label: "Generated module dir", target: path.dirname(path.join(workspaceRoot, config.generatedModule)), kind: "dir" },
  ];

  for (const item of requiredPaths) {
    const exists = await pathExists(item.target);
    if (!exists) {
      record(
        "fail",
        item.label,
        `${path.relative(workspaceRoot, item.target)} is missing.`,
        `Create ${path.relative(workspaceRoot, item.target)} or scaffold the workspace again.`,
      );
      continue;
    }

    const targetStat = await stat(item.target);
    if (item.kind === "dir" && !targetStat.isDirectory()) {
      record(
        "fail",
        item.label,
        `${path.relative(workspaceRoot, item.target)} is not a directory.`,
        `Fix ${path.relative(workspaceRoot, item.target)} so it is a directory.`,
      );
      continue;
    }

    if (item.kind === "file" && !targetStat.isFile()) {
      record(
        "fail",
        item.label,
        `${path.relative(workspaceRoot, item.target)} is not a file.`,
        `Fix ${path.relative(workspaceRoot, item.target)} so it is a file.`,
      );
      continue;
    }

    record("ok", item.label, path.relative(workspaceRoot, item.target));
  }

  const prdCount = await fileCount(path.join(workspaceRoot, config.contentDir), (entry) =>
    entry.isFile() && entry.name.endsWith(".md"),
  );
  if (prdCount > 0) {
    record("ok", "PRD documents", `${prdCount} file(s) under ${config.contentDir}`);
  } else {
    record("warn", "PRD documents", `No .md files found under ${config.contentDir}.`, `Add at least one PRD Markdown file under ${config.contentDir}.`);
  }

  const themeCount = await fileCount(path.join(workspaceRoot, config.themeDir), (entry) =>
    entry.isFile() && entry.name.endsWith(".json"),
  );
  if (themeCount > 0) {
    record("ok", "Theme presets", `${themeCount} theme file(s)`);
  } else {
    record("warn", "Theme presets", "No theme presets found.", `Add at least one theme preset JSON under ${config.themeDir}.`);
  }

  console.log("");
  section("Dependencies");

  const packageManager = packageJson.packageManager || "unknown";
  record("ok", "Package manager hint", packageManager);

  const nodeModulesExists = await pathExists(path.join(workspaceRoot, "node_modules"));
  if (nodeModulesExists) {
    record("ok", "Dependencies", "node_modules present");
  } else {
    record("warn", "Dependencies", "node_modules missing.", "Run npm install or bun install.");
  }

  console.log("");
  section("Render Health");

  try {
    const { issues } = await renderCatalog(workspaceRoot);
    if (issues.length === 0) {
      record("ok", "Render validation", "No validation issues found.");
    } else {
      record("warn", "Render validation", `${issues.length} issue(s) found.`, "Run npm run validate to inspect markdown or directive issues.");
    }
  } catch (error) {
    record(
      "fail",
      "Render validation",
      error instanceof Error ? error.message : String(error),
      "Run npm run validate and fix the reported render problem.",
    );
  }

  const versionDirPath = path.join(workspaceRoot, config.versionDir);
  if (await pathExists(versionDirPath)) {
    record("ok", "Version directory", path.relative(workspaceRoot, versionDirPath));
  } else {
    record("warn", "Version directory", "No saved versions yet. It will be created on first save.", "Optional: save a version once to create the local version directory.");
  }

  const hasFailures = results.some((item) => item.level === "fail");
  const hasWarnings = results.some((item) => item.level === "warn");
  const uniqueNextSteps = [...new Set(nextSteps)];

  console.log("");
  if (hasFailures) {
    console.log("Doctor result: environment has blocking issues.");
    if (uniqueNextSteps.length > 0) {
      console.log("");
      console.log("Suggested next steps:");
      for (const step of uniqueNextSteps) {
        console.log(`- ${step}`);
      }
    }
    process.exitCode = 1;
    return;
  }

  if (hasWarnings) {
    console.log("Doctor result: environment is usable, with a few recommended fixes.");
    if (uniqueNextSteps.length > 0) {
      console.log("");
      console.log("Suggested next steps:");
      for (const step of uniqueNextSteps) {
        console.log(`- ${step}`);
      }
    }
    return;
  }

  console.log("Doctor result: environment looks ready.");
  console.log("");
  console.log("Suggested next steps:");
  console.log("- Run npm run dev to start the authoring workspace.");
  console.log("- Run npm run build before sharing a fresh HTML preview.");
}

async function run() {
  const [, , command, ...args] = process.argv;

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "init") {
    if (!args[0]) {
      throw new Error("Usage: live-prd init <dir>");
    }
    await initWorkspace(args[0]);
    return;
  }

  if (command === "dev" || command === "build" || command === "preview") {
    await runViteCommand(command, args);
    return;
  }

  if (command === "skill-install") {
    await runInstallSkill(args);
    return;
  }

  if (command === "release-local") {
    await runReleaseLocal();
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
    const config = await loadConfig(workspaceRoot);
    const themes = await listThemes(workspaceRoot, config);
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

  if (command === "doctor") {
    await runDoctor();
    return;
  }

  if (command !== "validate" && command !== "render") {
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }

  const { config, documents, issues } = await renderCatalog(workspaceRoot, args[0]);

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

  await writeGeneratedModule(workspaceRoot, config, documents);
  await writeDistArtifacts(workspaceRoot, config, documents);

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
