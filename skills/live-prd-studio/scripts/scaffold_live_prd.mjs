#!/usr/bin/env node

import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, "..");
const templateRoot = path.join(skillRoot, "assets", "templates");

const args = process.argv.slice(2);
const targetDir = args[0];
const force = args.includes("--force");

if (!targetDir) {
  console.error("Usage: node scaffold_live_prd.mjs <target-dir> [--force]");
  process.exit(1);
}

const absoluteTarget = path.resolve(process.cwd(), targetDir);

const files = [
  {
    template: "example-prd.md",
    output: path.join("docs", "prd", "checkout-timeout-recovery.md"),
  },
  {
    template: "example-live-demo.tsx",
    output: path.join("demos", "retry-card.tsx"),
  },
  {
    template: "example-live-page.tsx",
    output: path.join("demos", "checkout-recovery-page.tsx"),
  },
  {
    template: "theme-editorial-warm.json",
    output: path.join("themes", "editorial-warm.json"),
  },
  {
    template: "live-prd.config.json",
    output: "live-prd.config.json",
  },
];

const directories = [
  path.join("apps", "web"),
  path.join("packages", "engine"),
  path.join("packages", "cli"),
  path.join("docs", "prd"),
  "demos",
  "themes",
];

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function writeTemplate(templateName, relativeOutput) {
  const source = path.join(templateRoot, templateName);
  const destination = path.join(absoluteTarget, relativeOutput);

  if (!force && (await exists(destination))) {
    console.log(`skip ${relativeOutput}`);
    return;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  const contents = await readFile(source, "utf8");
  await writeFile(destination, contents, "utf8");
  console.log(`write ${relativeOutput}`);
}

async function main() {
  await mkdir(absoluteTarget, { recursive: true });

  for (const directory of directories) {
    await mkdir(path.join(absoluteTarget, directory), { recursive: true });
  }

  for (const file of files) {
    await writeTemplate(file.template, file.output);
  }

  const packageJsonPath = path.join(absoluteTarget, "package.json");
  if (force || !(await exists(packageJsonPath))) {
    const packageJson = {
      name: path.basename(absoluteTarget),
      private: true,
      packageManager: "bun@latest",
      scripts: {
        dev: "echo \"wire apps/web dev server here\"",
        render: "echo \"wire packages/engine renderer here\"",
        validate:
          "node ./scripts/validate_prd_stub.mjs ./docs/prd/checkout-timeout-recovery.md",
      },
    };

    await writeFile(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`,
      "utf8",
    );
    console.log("write package.json");
  }

  const localScriptDir = path.join(absoluteTarget, "scripts");
  await mkdir(localScriptDir, { recursive: true });
  await cp(
    path.join(skillRoot, "scripts", "validate_live_prd_doc.mjs"),
    path.join(localScriptDir, "validate_prd_stub.mjs"),
    { force: true },
  );
  console.log("write scripts/validate_prd_stub.mjs");

  console.log("");
  console.log("Starter live PRD workspace created.");
  console.log(`Next: cd ${absoluteTarget}`);
  console.log("Then: review docs/prd/checkout-timeout-recovery.md and connect your Vite runtime.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
