#!/usr/bin/env node

import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function timestamp() {
  const value = new Date();
  const pad = (input) => String(input).padStart(2, "0");
  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
    "-",
    pad(value.getHours()),
    pad(value.getMinutes()),
    pad(value.getSeconds()),
  ].join("");
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyEntry(sourcePath, targetPath) {
  await cp(sourcePath, targetPath, {
    recursive: true,
    filter: (currentSource) => {
      const relative = path.relative(projectRoot, currentSource);
      if (!relative) {
        return true;
      }

      const normalized = relative.split(path.sep).join("/");
      if (
        normalized === "docs/prd/.versions" ||
        normalized.startsWith("docs/prd/.versions/") ||
        normalized.startsWith("dist/release/")
      ) {
        return false;
      }

      return true;
    },
  });
}

export async function runReleaseLocal() {
  const releaseId = `live-prd-release-${timestamp()}`;
  const releaseRoot = path.join(projectRoot, "dist", "release", releaseId);

  if (await exists(releaseRoot)) {
    await rm(releaseRoot, { recursive: true, force: true });
  }

  await mkdir(releaseRoot, { recursive: true });

  const entries = [
    "skills",
    "apps",
    "packages",
    "docs/prd",
    "demos",
    "themes",
    "scripts",
    "package.json",
    "live-prd.config.json",
    "README.md",
  ];

  for (const entry of entries) {
    await copyEntry(path.join(projectRoot, entry), path.join(releaseRoot, entry));
  }

  const rootReadme = await readFile(path.join(projectRoot, "README.md"), "utf8").catch(() => "");
  const installGuide = [
    "# Release Bundle",
    "",
    `Created: ${new Date().toISOString()}`,
    "",
    "Quick start:",
    "1. cd into this bundle root.",
    "2. Run `npm install`.",
    "3. Run `npm run doctor`.",
    "4. Run `npm run dev` for authoring or `npm run build` for a shareable build.",
    "5. Run `npm run skill:install` to install the bundled skill bundle for your AI tool.",
    "",
    rootReadme ? "See README.md for full details." : "",
  ].filter(Boolean).join("\n");

  await writeFile(path.join(releaseRoot, "RELEASE_NOTES.md"), `${installGuide}\n`, "utf8");

  console.log(`Created local release bundle at ${releaseRoot}`);
  console.log("Included:");
  for (const entry of entries) {
    console.log(`- ${entry}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runReleaseLocal().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exit(1);
  });
}
