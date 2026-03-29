#!/usr/bin/env node

import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const sourceDirCandidates = [
  path.join(projectRoot, "skills", "live-prd"),
  path.join(projectRoot, "packages", "cli", "assets", "live-prd"),
];

function printUsage() {
  console.log("Usage: node ./scripts/install-skill.mjs [--target <dir>] [--force]");
}

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveSourceDir() {
  for (const candidate of sourceDirCandidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }

  throw new Error("Could not find the bundled live-prd skill assets in this workspace.");
}

export async function runInstallSkill(args = process.argv.slice(2)) {
  let targetRoot = path.join(process.cwd(), ".agents", "skills");
  let force = false;
  const sourceDir = await resolveSourceDir();

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--target") {
      targetRoot = path.resolve(args[index + 1] || "");
      index += 1;
      continue;
    }

    if (arg === "--force") {
      force = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printUsage();
      return;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  const targetDir = path.join(targetRoot, "live-prd");
  await mkdir(targetRoot, { recursive: true });

  if (await exists(targetDir)) {
    if (!force) {
      throw new Error(`Skill already exists at ${targetDir}. Re-run with --force to replace it.`);
    }

    await rm(targetDir, { force: true, recursive: true });
  }

  await cp(sourceDir, targetDir, { recursive: true });

  const manifest = {
    installedAt: new Date().toISOString(),
    sourceDir,
    targetDir,
  };

  await writeFile(
    path.join(targetDir, ".install-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  const skillDoc = await readFile(path.join(targetDir, "SKILL.md"), "utf8");
  const firstLine = skillDoc.split("\n").find((line) => line.startsWith("name:")) || "name: live-prd";

  console.log(`Installed ${firstLine.replace("name:", "").trim()} to ${targetDir}`);
  console.log("Next step: configure your AI tool to load skills from this project-local .agents/skills directory if needed.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runInstallSkill().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
