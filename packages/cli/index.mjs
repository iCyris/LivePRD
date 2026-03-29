#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { execFile as execFileCallback, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { runInstallSkill } from "../../scripts/install-skill.mjs";
import { runReleaseLocal } from "../../scripts/release-local.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "../..");
const execFile = promisify(execFileCallback);
const workspaceRoot = process.cwd();
const defaultWorkspaceConfig = {
  contentDir: "docs/prd",
  demoDir: "demos",
  themeDir: "themes",
  defaultTheme: "editorial-warm",
  generatedModule: ".live-prd/generated/prd-data.mjs",
  distDir: "dist/prd",
};
const workspaceMetaDir = ".live-prd";
const workspaceManifestPath = path.join(workspaceMetaDir, "manifest.json");
const workspaceBackupsDir = path.join(workspaceMetaDir, "backups");
const starterSourceEntries = [
  { source: "apps", target: path.join(workspaceMetaDir, "runtime", "apps"), type: "dir" },
  { source: "packages", target: path.join(workspaceMetaDir, "runtime", "packages"), type: "dir" },
  { source: "scripts", target: path.join(workspaceMetaDir, "runtime", "scripts"), type: "dir" },
  { source: path.join("themes", "editorial-warm.json"), target: path.join("themes", "editorial-warm.json"), type: "file" },
];
let engineModulePromise = null;

function loadEngine() {
  if (!engineModulePromise) {
    engineModulePromise = import("../engine/index.mjs");
  }

  return engineModulePromise;
}

function isMissingDependencyError(error) {
  return (
    error?.code === "ERR_MODULE_NOT_FOUND" ||
    /Cannot find package/.test(error?.message || "")
  );
}

async function loadEngineForWorkspace() {
  try {
    return await loadEngine();
  } catch (error) {
    if (isMissingDependencyError(error)) {
      throw new Error("Dependencies are not installed yet. Run npm install or bun install first.");
    }

    throw error;
  }
}

async function readWorkspaceConfig(projectRoot = workspaceRoot) {
  const configPath = path.join(projectRoot, "live-prd.config.json");

  try {
    const raw = await readFile(configPath, "utf8");
    return {
      ...defaultWorkspaceConfig,
      ...JSON.parse(raw),
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { ...defaultWorkspaceConfig };
    }

    throw error;
  }
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

async function hashFile(filePath) {
  const contents = await readFile(filePath);
  return createHash("sha256").update(contents).digest("hex");
}

async function listFilesRecursive(rootDir, options = {}) {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);
    const normalized = toPosixPath(path.relative(options.relativeFrom || rootDir, absolutePath));

    if (
      normalized === "node_modules" ||
      normalized.startsWith("node_modules/") ||
      normalized.includes("/node_modules/") ||
      normalized.endsWith("/node_modules") ||
      normalized === "dist" ||
      normalized.startsWith("dist/") ||
      normalized.includes("/dist/") ||
      normalized.endsWith("/dist") ||
      normalized === ".git" ||
      normalized.startsWith(".git/") ||
      normalized.includes("/.git/")
    ) {
      continue;
    }

    if (options.exclude?.some((pattern) => normalized === pattern || normalized.startsWith(`${pattern}/`))) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(absolutePath, options)));
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

async function getPackageVersion(projectRoot = packageRoot) {
  const raw = await readFile(path.join(projectRoot, "package.json"), "utf8");
  return JSON.parse(raw).version || "0.0.0";
}

function normalizeWorkspacePackageJson(packageJson, fallbackName) {
  return {
    ...packageJson,
    name: packageJson.name || fallbackName,
    private: true,
  };
}

async function createWorkspacePackageJsonTemplate(targetDirName) {
  const rootPackageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  return {
    name: targetDirName,
    private: true,
    type: "module",
    packageManager: rootPackageJson.packageManager,
    scripts: {
      "live-prd": "node ./.live-prd/runtime/packages/cli/index.mjs",
      cli: "node ./.live-prd/runtime/packages/cli/index.mjs",
      doctor: "node ./.live-prd/runtime/packages/cli/index.mjs doctor",
      validate: "node ./.live-prd/runtime/packages/cli/index.mjs validate",
      render: "node ./.live-prd/runtime/packages/cli/index.mjs render",
      dev: "node ./.live-prd/runtime/packages/cli/index.mjs dev",
      build: "node ./.live-prd/runtime/packages/cli/index.mjs build",
      preview: "node ./.live-prd/runtime/packages/cli/index.mjs preview",
      "release:local": "node ./.live-prd/runtime/packages/cli/index.mjs release-local",
    },
    dependencies: {
      ...(rootPackageJson.dependencies || {}),
    },
  };
}

function runtimeRootFor(projectRoot = workspaceRoot) {
  return path.join(projectRoot, workspaceMetaDir, "runtime");
}

async function scanStarterSourceFiles() {
  const files = [];

  for (const entry of starterSourceEntries) {
    const sourceCandidates = entry.sourceCandidates || [entry.source];
    let absoluteSource = null;
    for (const candidate of sourceCandidates) {
      const candidatePath = path.join(packageRoot, candidate);
      if (await pathExists(candidatePath)) {
        absoluteSource = candidatePath;
        break;
      }
    }

    if (!absoluteSource) {
      continue;
    }

    if (entry.type === "file") {
      files.push({
        absoluteSource,
        targetPath: toPosixPath(entry.target),
      });
      continue;
    }

    const nestedFiles = await listFilesRecursive(absoluteSource, {
      exclude: sourceCandidates.includes("apps") ? ["apps/web/src/runtime-generated"] : [],
      relativeFrom: packageRoot,
    });
    for (const file of nestedFiles) {
      const relativeWithinEntry = path.relative(absoluteSource, file);
      files.push({
        absoluteSource: file,
        targetPath: toPosixPath(path.join(entry.target, relativeWithinEntry)),
      });
    }
  }

  return files.sort((left, right) => left.targetPath.localeCompare(right.targetPath));
}

async function buildManagedSourceMap() {
  const managed = {};
  for (const file of await scanStarterSourceFiles()) {
    managed[file.targetPath] = {
      sourcePath: file.absoluteSource,
      sourceHash: await hashFile(file.absoluteSource),
    };
  }
  return managed;
}

async function readWorkspaceManifest(projectRoot = workspaceRoot) {
  try {
    const raw = await readFile(path.join(projectRoot, workspaceManifestPath), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeWorkspaceManifest(projectRoot, manifest) {
  const absoluteManifestPath = path.join(projectRoot, workspaceManifestPath);
  await mkdir(path.dirname(absoluteManifestPath), { recursive: true });
  await writeFile(absoluteManifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function createManagedManifest(projectRoot, options = {}) {
  const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
  const managedSourceMap = await buildManagedSourceMap();
  const managedFiles = {};

  for (const targetPath of Object.keys(managedSourceMap)) {
    const absolutePath = path.join(projectRoot, targetPath);
    if (!(await pathExists(absolutePath))) {
      continue;
    }

    managedFiles[targetPath] = {
      appliedHash: await hashFile(absolutePath),
    };
  }

  return {
    schemaVersion: 1,
    workspaceVersion: options.workspaceVersion || packageJson.version || "0.0.0",
    generatedAt: new Date().toISOString(),
    managedFiles,
    mixedFiles: {
      packageJsonTemplateVersion: await getPackageVersion(packageRoot),
      configTemplateVersion: await getPackageVersion(packageRoot),
    },
  };
}

async function ensureWorkspaceManifest(projectRoot = workspaceRoot) {
  const existing = await readWorkspaceManifest(projectRoot);
  if (existing) {
    return existing;
  }

  const manifest = await createManagedManifest(projectRoot);
  await writeWorkspaceManifest(projectRoot, manifest);
  return manifest;
}

function mergeWorkspaceConfig(currentConfig, templateConfig) {
  return {
    ...templateConfig,
    ...currentConfig,
  };
}

function mergeWorkspacePackageJson(currentPackageJson, templatePackageJson) {
  return {
    ...templatePackageJson,
    ...currentPackageJson,
    packageManager: templatePackageJson.packageManager,
    workspaces: templatePackageJson.workspaces,
    scripts: {
      ...(currentPackageJson.scripts || {}),
      ...(templatePackageJson.scripts || {}),
    },
    dependencies: {
      ...(currentPackageJson.dependencies || {}),
      ...(templatePackageJson.dependencies || {}),
    },
  };
}

async function readJsonFile(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function createUpgradePlan(projectRoot = workspaceRoot) {
  const manifest = await ensureWorkspaceManifest(projectRoot);
  const managedSourceMap = await buildManagedSourceMap();
  const managedChanges = [];

  for (const [targetPath, source] of Object.entries(managedSourceMap)) {
    const absoluteTarget = path.join(projectRoot, targetPath);
    const previous = manifest.managedFiles?.[targetPath] || null;
    const currentExists = await pathExists(absoluteTarget);
    const currentHash = currentExists ? await hashFile(absoluteTarget) : null;

    if (!previous) {
      if (!currentExists) {
        managedChanges.push({ kind: "add", targetPath, sourcePath: source.sourcePath, sourceHash: source.sourceHash });
      } else if (currentHash === source.sourceHash) {
        managedChanges.push({ kind: "adopt", targetPath, sourcePath: source.sourcePath, sourceHash: source.sourceHash });
      } else {
        managedChanges.push({ kind: "conflict", targetPath, sourcePath: source.sourcePath, sourceHash: source.sourceHash, currentHash });
      }
      continue;
    }

    if (source.sourceHash === previous.appliedHash) {
      managedChanges.push({
        kind: currentHash && currentHash !== previous.appliedHash ? "customized" : "unchanged",
        targetPath,
        sourcePath: source.sourcePath,
        sourceHash: source.sourceHash,
        currentHash,
        previousAppliedHash: previous.appliedHash,
      });
      continue;
    }

    if (!currentExists || currentHash === previous.appliedHash) {
      managedChanges.push({
        kind: "update",
        targetPath,
        sourcePath: source.sourcePath,
        sourceHash: source.sourceHash,
        currentHash,
        previousAppliedHash: previous.appliedHash,
      });
      continue;
    }

    managedChanges.push({
      kind: "conflict",
      targetPath,
      sourcePath: source.sourcePath,
      sourceHash: source.sourceHash,
      currentHash,
      previousAppliedHash: previous.appliedHash,
    });
  }

  const currentPackageJson = await readJsonFile(path.join(projectRoot, "package.json"));
  const templatePackageJson = await createWorkspacePackageJsonTemplate(currentPackageJson.name || path.basename(projectRoot));
  const mergedPackageJson = mergeWorkspacePackageJson(currentPackageJson, templatePackageJson);
  const packageJsonChange = stableJson(currentPackageJson) === stableJson(mergedPackageJson)
    ? null
    : { targetPath: "package.json", nextContents: stableJson(mergedPackageJson) };

  const currentConfig = await readWorkspaceConfig(projectRoot);
  const templateConfig = JSON.parse(await readFile(path.join(packageRoot, "live-prd.config.json"), "utf8"));
  const mergedConfig = mergeWorkspaceConfig(currentConfig, templateConfig);
  const configChange = stableJson(currentConfig) === stableJson(mergedConfig)
    ? null
    : { targetPath: "live-prd.config.json", nextContents: stableJson(mergedConfig) };

  return {
    manifest,
    managedChanges,
    mixedChanges: [packageJsonChange, configChange].filter(Boolean),
    targetVersion: await getPackageVersion(packageRoot),
  };
}

function summarizeUpgradePlan(plan) {
  const counts = {
    add: 0,
    adopt: 0,
    update: 0,
    conflict: 0,
    customized: 0,
    unchanged: 0,
    mixed: plan.mixedChanges.length,
  };

  for (const item of plan.managedChanges) {
    counts[item.kind] = (counts[item.kind] || 0) + 1;
  }

  return counts;
}

async function writeBackupFile(backupRoot, projectRoot, relativePath, existed) {
  const absoluteTarget = path.join(projectRoot, relativePath);
  const backupTarget = path.join(backupRoot, "files", relativePath);
  await mkdir(path.dirname(backupTarget), { recursive: true });

  if (!existed) {
    return;
  }

  await cp(absoluteTarget, backupTarget, { force: true });
}

async function applyUpgradePlan(projectRoot = workspaceRoot, options = {}) {
  const plan = await createUpgradePlan(projectRoot);
  const actionableManaged = plan.managedChanges.filter((item) => ["add", "adopt", "update"].includes(item.kind));
  const conflicts = plan.managedChanges.filter((item) => item.kind === "conflict");

  if (options.dryRun) {
    return {
      ...plan,
      conflicts,
      applied: false,
    };
  }

  const backupId = new Date().toISOString().replaceAll(":", "").replaceAll(".", "-");
  const backupRoot = path.join(projectRoot, workspaceBackupsDir, backupId);
  await mkdir(backupRoot, { recursive: true });

  const filesToBackup = [
    ...actionableManaged.map((item) => item.targetPath),
    ...plan.mixedChanges.map((item) => item.targetPath),
    workspaceManifestPath,
  ];

  const backupMetadata = {
    id: backupId,
    createdAt: new Date().toISOString(),
    workspaceVersionBefore: plan.manifest.workspaceVersion || "0.0.0",
    files: [],
  };

  for (const relativePath of filesToBackup) {
    const existed = await pathExists(path.join(projectRoot, relativePath));
    await writeBackupFile(backupRoot, projectRoot, relativePath, existed);
    backupMetadata.files.push({ path: relativePath, existed });
  }

  await writeFile(path.join(backupRoot, "backup.json"), stableJson(backupMetadata), "utf8");

  for (const item of actionableManaged) {
    const absoluteTarget = path.join(projectRoot, item.targetPath);
    await mkdir(path.dirname(absoluteTarget), { recursive: true });
    await cp(item.sourcePath, absoluteTarget, { force: true });
  }

  for (const item of plan.mixedChanges) {
    const absoluteTarget = path.join(projectRoot, item.targetPath);
    await writeFile(absoluteTarget, item.nextContents, "utf8");
  }

  for (const conflict of conflicts) {
    const conflictTarget = path.join(backupRoot, "conflicts", conflict.targetPath);
    await mkdir(path.dirname(conflictTarget), { recursive: true });
    await cp(conflict.sourcePath, conflictTarget, { force: true });
  }

  const nextManifest = await createManagedManifest(projectRoot, {
    workspaceVersion: plan.targetVersion,
  });
  await writeWorkspaceManifest(projectRoot, nextManifest);

  return {
    ...plan,
    conflicts,
    backupId,
    applied: true,
  };
}

async function rollbackUpgrade(projectRoot, backupId) {
  const backupRoot = path.join(projectRoot, workspaceBackupsDir, backupId);
  const backupMetadataPath = path.join(backupRoot, "backup.json");
  const backupMetadata = await readJsonFile(backupMetadataPath);

  for (const entry of backupMetadata.files || []) {
    const absoluteTarget = path.join(projectRoot, entry.path);
    const absoluteBackup = path.join(backupRoot, "files", entry.path);

    if (!entry.existed) {
      await rm(absoluteTarget, { force: true, recursive: true });
      continue;
    }

    await mkdir(path.dirname(absoluteTarget), { recursive: true });
    await cp(absoluteBackup, absoluteTarget, { force: true });
  }

  return backupMetadata;
}

function printUpgradeSummary(plan) {
  const summary = summarizeUpgradePlan(plan);
  console.log(`Upgrade target version: ${plan.targetVersion}`);
  console.log(`- ${summary.update} managed file(s) will update`);
  console.log(`- ${summary.add + summary.adopt} managed file(s) will be added`);
  console.log(`- ${summary.customized} managed file(s) were customized locally`);
  console.log(`- ${summary.conflict} managed file(s) need manual review`);
  console.log(`- ${summary.mixed} merged config file(s) will update`);
}

async function listWorkspaceThemes(projectRoot, config) {
  const themeRoot = path.join(projectRoot, config.themeDir);
  const entries = await readdir(themeRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/, ""))
    .sort();
}

function createDemoMarker(marker = "primary") {
  return `<!-- DEMO: ${marker} -->`;
}

function createPrdTemplate({ title, slug, theme }) {
  return `---
title: ${title}
slug: ${slug}
owner: PD Team
status: draft
summary: Summarize the intended user outcome here.
theme: ${theme}
reviewers:
  - Design
  - Frontend
---

# ${title}

## Background

Describe the business context and why this work matters now.

## Problem

Describe the user problem and what is broken or missing today.

## Goals

- Goal 1

## Non-Goals

- Non-goal 1

## User Flow

1. Step 1

## States and Edge Cases

- Edge case 1

## Live Demo

Insert interactive proof points here only when the PRD truly needs them.

${createDemoMarker("primary")}

## Acceptance Criteria

- Criterion 1

## Open Questions

- Question 1
`;
}

function parseOptionArgs(args) {
  const positional = [];
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (!value.startsWith("--")) {
      positional.push(value);
      continue;
    }

    const key = value.slice(2);
    const nextValue = args[index + 1];
    if (!nextValue || nextValue.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = nextValue;
    index += 1;
  }

  return { positional, options };
}

function normalizeHeadingLabel(value) {
  return String(value || "")
    .trim()
    .replace(/^#{1,6}\s*/, "")
    .toLowerCase();
}

function collectMarkdownHeadings(markdown) {
  const headings = [];
  const pattern = /^(#{1,6})\s+(.+?)\s*$/gm;
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      start: match.index,
      end: pattern.lastIndex,
    });
  }

  return headings;
}

function parseDirectiveFields(raw) {
  const fields = {};

  for (const line of raw.split("\n")) {
    const match = line.trim().match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (match) {
      fields[match[1]] = match[2].trim();
    }
  }

  return fields;
}

function joinMarkdownWithBlock(before, block, after) {
  const trimmedBlock = block.trim();
  const trimmedBefore = before.replace(/\s*$/, "");
  const trimmedAfter = after.replace(/^\s*/, "");

  if (!trimmedBefore && !trimmedAfter) {
    return `${trimmedBlock}\n`;
  }

  if (!trimmedBefore) {
    return `${trimmedBlock}\n\n${trimmedAfter}`;
  }

  if (!trimmedAfter) {
    return `${trimmedBefore}\n\n${trimmedBlock}\n`;
  }

  return `${trimmedBefore}\n\n${trimmedBlock}\n\n${trimmedAfter}`;
}

function createDirectiveBlock({ kind, id, source, height, theme, caption, route }) {
  const lines = [
    kind === "page" ? ":::live-page" : ":::live-demo",
    `id: ${id}`,
    `source: ${source}`,
  ];

  if (kind === "page") {
    lines.push(`route: ${route}`);
  }

  lines.push(`height: ${height}`);
  lines.push(`theme: ${theme}`);
  lines.push(`caption: ${caption}`);
  lines.push(":::");
  return lines.join("\n");
}

function replaceDirectiveById(markdown, targetId, nextBlock) {
  const directivePattern = /:::live-(demo|page)\n([\s\S]*?):::/g;
  let match;

  while ((match = directivePattern.exec(markdown)) !== null) {
    const fields = parseDirectiveFields(match[2]);
    if (fields.id === targetId) {
      return `${markdown.slice(0, match.index)}${nextBlock}${markdown.slice(match.index + match[0].length)}`;
    }
  }

  throw new Error(`Could not find live block with id "${targetId}".`);
}

function collectLiveBlockIds(markdown) {
  const ids = [];
  const directivePattern = /:::live-(demo|page)\n([\s\S]*?):::/g;
  let match;

  while ((match = directivePattern.exec(markdown)) !== null) {
    const fields = parseDirectiveFields(match[2]);
    if (fields.id) {
      ids.push(fields.id);
    }
  }

  return ids;
}

function assertUniqueLiveBlockId(markdown, nextId, replaceId, file) {
  if (!nextId) {
    return;
  }

  const remainingIds = collectLiveBlockIds(markdown)
    .filter((id) => !replaceId || id !== replaceId);

  if (remainingIds.includes(nextId)) {
    throw new Error(
      `Live block id "${nextId}" already exists in ${file}. Use --replace-id <id> or choose a different --id.`,
    );
  }
}

function extractLiveBlockId(block) {
  const ids = collectLiveBlockIds(block);
  return ids[0] || null;
}

function insertDirectiveIntoMarkdown(markdown, { nextBlock, replaceId, marker, afterHeading, beforeHeading }) {
  const activeModes = [replaceId, marker, afterHeading, beforeHeading].filter(Boolean);
  if (activeModes.length > 1) {
    throw new Error("Choose only one placement mode: --replace-id, --marker, --after-heading, or --before-heading.");
  }

  if (replaceId) {
    return replaceDirectiveById(markdown, replaceId, nextBlock);
  }

  if (marker) {
    const markerText = marker.startsWith("<!--") ? marker : createDemoMarker(marker);
    if (!markdown.includes(markerText)) {
      throw new Error(`Could not find marker "${markerText}".`);
    }

    return markdown.replace(markerText, `${nextBlock}\n\n${markerText}`);
  }

  const headings = collectMarkdownHeadings(markdown);
  const matchHeading = (value) =>
    headings.find((heading) => normalizeHeadingLabel(heading.text) === normalizeHeadingLabel(value));

  if (beforeHeading) {
    const target = matchHeading(beforeHeading);
    if (!target) {
      throw new Error(`Could not find heading "${beforeHeading}".`);
    }

    return joinMarkdownWithBlock(
      markdown.slice(0, target.start),
      nextBlock,
      markdown.slice(target.start),
    );
  }

  const resolvedAfterHeading = afterHeading
    ?? (markdown.includes(createDemoMarker("primary")) ? null : "Live Demo");

  if (!afterHeading && markdown.includes(createDemoMarker("primary"))) {
    return insertDirectiveIntoMarkdown(markdown, {
      nextBlock,
      marker: "primary",
    });
  }

  if (!resolvedAfterHeading) {
    throw new Error("Could not determine where to insert the live block.");
  }

  const target = matchHeading(resolvedAfterHeading);
  if (!target) {
    throw new Error(`Could not find heading "${resolvedAfterHeading}".`);
  }

  let insertionIndex = markdown.length;
  const targetIndex = headings.findIndex((heading) => heading.start === target.start);
  for (let index = targetIndex + 1; index < headings.length; index += 1) {
    if (headings[index].level <= target.level) {
      insertionIndex = headings[index].start;
      break;
    }
  }

  return joinMarkdownWithBlock(
    markdown.slice(0, insertionIndex),
    nextBlock,
    markdown.slice(insertionIndex),
  );
}

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
  console.log("  add-demo <name>   Create a demo component stub, optionally insert it into a PRD");
  console.log("  add-page <name>   Create a page component stub, optionally insert it into a PRD");
  console.log("  skill-install     Install the bundled skill bundle for an AI tool");
  console.log("  release-local     Create a local release bundle under dist/release");
  console.log("  upgrade check     Compare this workspace with the current live-prd system files");
  console.log("  upgrade apply     Safely apply compatible system updates with backup");
  console.log("  upgrade rollback <backup-id>  Restore files from a recorded upgrade backup");
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

async function resolveUiImportLine(isPage = false) {
  const visibleAppPath = path.join(workspaceRoot, "apps", "web", "src", "components", "ui");
  const basePath = (await pathExists(visibleAppPath)) ? "../apps/web/src/components/ui" : "../.live-prd/runtime/apps/web/src/components/ui";

  return isPage
    ? `import { Badge } from "${basePath}/badge.jsx";`
    : `import { Button } from "${basePath}/button.jsx";`;
}

async function createDemoSourceContents(name, isPage = false) {
  const pascalName = toPascalCase(name);
  const importLine = await resolveUiImportLine(isPage);

  return isPage
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
}

function parseHeight(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createAgentsMdTemplate(projectName) {
  return `# AGENTS.md

This workspace is a Live PRD project. AI agents working here must follow this workflow.

## Primary Goal

- Keep the PRD under \`docs/prd/*.md\` as the source of truth.
- Use the local Live PRD site so the user can inspect the rendered HTML and embedded demos while iterating.
- Do not stop after generating Markdown unless the user explicitly asks for Markdown only.
- Do not invent CLI package names or suggest \`npm install -g\` for an unverified package.
- If a command such as \`live-prd\` is unavailable, use the verified local workspace command instead of guessing an installation path.

## Required Workflow

1. Inspect the workspace state before acting.

- If this workspace is not fully set up, run:
  \`npm install\`
  \`npm run doctor\`

2. Start the local authoring site for active PRD work.

- Use:
  \`npm run dev\`
- Keep the preview running while editing PRDs and demos.

3. Create or update PRDs with the real CLI.

- Create a PRD:
  \`npm run live-prd -- new <slug>\`
- Edit the canonical Markdown in:
  \`docs/prd/*.md\`
- When the user asks to change requirements, copy, flows, scope, acceptance criteria, or business rules, update the PRD Markdown first.
- Treat demo changes as supporting proof of the PRD, not as a replacement for updating the PRD text.

4. Create or insert demos with the real CLI.

- For the first creation of a new demo or page module, use the CLI instead of manually creating a new file path under \`demos/\`.
- Insert a component demo:
  \`npm run live-prd -- add-demo <name> --file docs/prd/<file>.md --after-heading "Live Demo"\`
- Insert a page demo:
  \`npm run live-prd -- add-page <name> --file docs/prd/<file>.md --after-heading "Live Demo"\`
- Demo source files live in:
  \`demos/*.jsx\`
- After creating or inserting a demo, the CLI refreshes the runtime artifacts so the preview can resolve the new module.
- If a demo file was created manually for any reason, run \`npm run render\` before trusting the preview.

5. Validate when the structure changes.

- Use:
  \`npm run validate\`

## Live Iteration Loop

- After each PRD or demo change, tell the user to inspect the running preview.
- The goal is to keep editing the PRD and its demos while the latest HTML rendering is visible.
- If a request changes product meaning, reflect that meaning in \`docs/prd/*.md\` and then update the related demo if needed.
- If a new demo was added, the preview should pick it up after the CLI refreshes runtime artifacts. If the page still shows stale output, refresh the browser or restart \`npm run dev\`.
- If the user asks for a production-style check, use:
  \`npm run build\`
  \`npm run preview\`

## Multi-PRD Safety

- If multiple files exist under \`docs/prd/\`, do not guess which PRD to edit from an ambiguous request like:
  \`continue\`
  \`modify this\`
  \`adjust the copy\`
  \`update the demo\`
- In those cases, confirm the target PRD first by slug or file path.

## Response Style

- Say what file or command you changed.
- Say what the user should look at next in the preview.
- Offer the next concrete Live PRD step.

Project: ${projectName}
`;
}

async function ensureDemoSource(name, isPage = false, options = {}) {
  const fileName = `${name}.jsx`;
  const targetPath = path.join(workspaceRoot, "demos", fileName);
  await mkdir(path.dirname(targetPath), { recursive: true });

  if (await pathExists(targetPath)) {
    if (!options.allowExisting) {
      throw new Error(`File already exists: ${targetPath}`);
    }

    return {
      created: false,
      fileName,
      targetPath,
    };
  }

  await writeFile(targetPath, await createDemoSourceContents(name, isPage), "utf8");
  return {
    created: true,
    fileName,
    targetPath,
  };
}

async function insertDirectiveIntoPrdFile(file, nextBlock, options = {}) {
  const absolutePath = path.resolve(workspaceRoot, file);
  const source = await readFile(absolutePath, "utf8");
  assertUniqueLiveBlockId(source, extractLiveBlockId(nextBlock), options["replace-id"], file);
  const nextSource = insertDirectiveIntoMarkdown(source, {
    nextBlock,
    replaceId: options["replace-id"],
    marker: options.marker,
    afterHeading: options["after-heading"],
    beforeHeading: options["before-heading"],
  });

  await writeFile(absolutePath, nextSource, "utf8");
  return absolutePath;
}

async function createPrd(slug) {
  const config = await readWorkspaceConfig(workspaceRoot);
  const title = toTitleCase(slug);
  const targetPath = path.join(workspaceRoot, config.contentDir, `${slug}.md`);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFileIfMissing(
    targetPath,
    createPrdTemplate({
      title,
      slug,
      theme: config.defaultTheme,
    }),
  );
  console.log(`Created ${path.relative(workspaceRoot, targetPath)}`);
  await syncWorkspaceArtifacts();
}

async function createDemo(name, isPage = false, options = {}) {
  const config = await readWorkspaceConfig(workspaceRoot);
  const { created, fileName, targetPath } = await ensureDemoSource(name, isPage, {
    allowExisting: Boolean(options.file),
  });
  const nextBlock = createDirectiveBlock({
    kind: isPage ? "page" : "demo",
    id: options.id || name,
    source: `demos/${fileName}`,
    route: isPage ? options.route || `/playground/${options.id || name}` : "",
    height: parseHeight(options.height, isPage ? 840 : 430),
    theme: options.theme || config.defaultTheme,
    caption:
      options.caption ||
      (isPage
        ? "Explain what this page demonstrates."
        : "Explain what this component demonstrates."),
  });

  console.log(`${created ? "Created" : "Reused"} ${path.relative(workspaceRoot, targetPath)}`);

  if (options.file) {
    const prdPath = await insertDirectiveIntoPrdFile(options.file, nextBlock, options);
    console.log(`Updated ${path.relative(workspaceRoot, prdPath)}`);
    await syncWorkspaceArtifacts();
    return;
  }

  await syncWorkspaceArtifacts();

  console.log("");
  console.log("Directive snippet:");
  console.log("");
  console.log(nextBlock);
}

async function setTheme(file, themeName) {
  const config = await readWorkspaceConfig(workspaceRoot);
  const availableThemes = await listWorkspaceThemes(workspaceRoot, config);
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

async function runCommand(command, args, cwd = workspaceRoot, env = process.env) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
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

async function syncWorkspaceArtifacts(targetFile = null) {
  const { renderCatalog, writeDistArtifacts, writeGeneratedModule, writeRuntimeGeneratedModules } = await loadEngineForWorkspace();
  const { config, documents, issues } = await renderCatalog(workspaceRoot, targetFile);
  const runtimeRoot = await pathExists(runtimeRootFor(workspaceRoot))
    ? runtimeRootFor(workspaceRoot)
    : packageRoot;

  await writeGeneratedModule(workspaceRoot, config, documents);
  await writeRuntimeGeneratedModules(workspaceRoot, runtimeRoot, config, documents);
  await writeDistArtifacts(workspaceRoot, config, documents);

  return {
    config,
    documents,
    issues,
    generatedModulePath: config.generatedModule || defaultWorkspaceConfig.generatedModule,
  };
}

async function runRender(targetFile = null) {
  const { config, documents, issues, generatedModulePath } = await syncWorkspaceArtifacts(targetFile);

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
  }

  console.log(`Rendered ${documents.length} PRD document(s).`);
  console.log(`Generated module: ${generatedModulePath}`);
  console.log(`Dist catalog: ${path.join(config.distDir, "catalog.json")}`);

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

async function runViteCommand(mode, extraArgs = []) {
  const viteBin = path.join(workspaceRoot, "node_modules", "vite", "bin", "vite.js");
  const viteConfig = path.join(packageRoot, "apps", "web", "vite.config.mjs");

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

  await runCommand(process.execPath, args, workspaceRoot, {
    ...process.env,
    LIVE_PRD_WORKSPACE_ROOT: workspaceRoot,
  });
}

async function copyStarterEntry(sourcePath, targetPath) {
  await mkdir(path.dirname(targetPath), { recursive: true });
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
        relative.includes("/node_modules/") ||
        relative.endsWith("/node_modules")
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

  const entries = ["apps", "packages", "scripts"];

  for (const entry of entries) {
    await copyStarterEntry(
      path.join(packageRoot, entry),
      path.join(absoluteTarget, workspaceMetaDir, "runtime", entry),
    );
  }

  await writeFile(
    path.join(absoluteTarget, "live-prd.config.json"),
    `${JSON.stringify(
      {
        contentDir: "docs/prd",
        demoDir: "demos",
        themeDir: "themes",
        defaultTheme: "editorial-warm",
        distDir: "dist/prd",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  await mkdir(path.join(absoluteTarget, "docs", "prd"), { recursive: true });
  await mkdir(path.join(absoluteTarget, "demos"), { recursive: true });
  await mkdir(path.join(absoluteTarget, "themes"), { recursive: true });

  await copyStarterEntry(
    path.join(packageRoot, "themes", "editorial-warm.json"),
    path.join(absoluteTarget, "themes", "editorial-warm.json"),
  );

  const workspacePackageJson = await createWorkspacePackageJsonTemplate(path.basename(absoluteTarget));

  await writeFile(
    path.join(absoluteTarget, "package.json"),
    `${JSON.stringify(workspacePackageJson, null, 2)}\n`,
    "utf8",
  );

  await writeFile(
    path.join(absoluteTarget, "README.md"),
    `# ${path.basename(absoluteTarget)}

Generated with live-prd.

## Quick Start

\`\`\`bash
npm install
npm run doctor
npm run dev
\`\`\`

## Common Tasks

\`\`\`bash
npm run live-prd -- new checkout-recovery
npm run live-prd -- add-demo retry-card --file docs/prd/checkout-recovery.md --after-heading "Live Demo"
\`\`\`
`,
    "utf8",
  );

  await writeFile(
    path.join(absoluteTarget, "AGENTS.md"),
    createAgentsMdTemplate(path.basename(absoluteTarget)),
    "utf8",
  );

  const { renderCatalog, writeDistArtifacts, writeGeneratedModule, writeRuntimeGeneratedModules } = await loadEngine();
  const { config, documents } = await renderCatalog(absoluteTarget);
  await writeGeneratedModule(absoluteTarget, config, documents);
  await writeRuntimeGeneratedModules(absoluteTarget, runtimeRootFor(absoluteTarget), config, documents);
  await writeDistArtifacts(absoluteTarget, config, documents);
  await writeWorkspaceManifest(absoluteTarget, await createManagedManifest(absoluteTarget, {
    workspaceVersion: await getPackageVersion(packageRoot),
  }));

  console.log(`Initialized live PRD workspace at ${absoluteTarget}`);
  console.log("Next steps:");
  console.log(`- cd ${absoluteTarget}`);
  console.log("- npm install");
  console.log("- npm run doctor");
  console.log("- npm run dev");
  console.log("- npm run live-prd -- new <slug>");
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
  const configPath = path.join(workspaceRoot, "live-prd.config.json");
  let config = { ...defaultWorkspaceConfig };
  let configLoadError = null;

  try {
    config = await readWorkspaceConfig(workspaceRoot);
  } catch (error) {
    configLoadError = error;
  }

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

  if (configLoadError) {
    record(
      "fail",
      "Config file",
      configLoadError instanceof Error ? configLoadError.message : String(configLoadError),
      "Fix live-prd.config.json so the workspace can be parsed.",
    );
  }

  const systemRootPath = await pathExists(runtimeRootFor(workspaceRoot))
    ? runtimeRootFor(workspaceRoot)
    : path.join(workspaceRoot, "apps");

  const requiredPaths = [
    { label: "Config file", target: configPath, kind: "file" },
    { label: "Content directory", target: path.join(workspaceRoot, config.contentDir), kind: "dir" },
    { label: "Demo directory", target: path.join(workspaceRoot, config.demoDir), kind: "dir" },
    { label: "Theme directory", target: path.join(workspaceRoot, config.themeDir), kind: "dir" },
    { label: "System layer", target: systemRootPath, kind: "dir" },
  ];

  for (const item of requiredPaths) {
    const exists = await pathExists(item.target);
    if (!exists) {
      record(
        "fail",
        item.label,
        `${path.relative(workspaceRoot, item.target)} is missing.`,
        `Restore ${path.relative(workspaceRoot, item.target)} by re-running live-prd init or applying a system update.`,
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

  const prdRoot = path.join(workspaceRoot, config.contentDir);
  if (await pathExists(prdRoot)) {
    const prdCount = await fileCount(prdRoot, (entry) =>
      entry.isFile() && entry.name.endsWith(".md"),
    );
    if (prdCount > 0) {
      record("ok", "PRD documents", `${prdCount} file(s) under ${config.contentDir}`);
    } else {
      record("warn", "PRD documents", `No .md files found under ${config.contentDir}.`, `Add at least one PRD Markdown file under ${config.contentDir}.`);
    }
  }

  const themeRoot = path.join(workspaceRoot, config.themeDir);
  if (await pathExists(themeRoot)) {
    const themeCount = await fileCount(themeRoot, (entry) =>
      entry.isFile() && entry.name.endsWith(".json"),
    );
    if (themeCount > 0) {
      record("ok", "Theme presets", `${themeCount} theme file(s)`);
    } else {
      record("warn", "Theme presets", "No theme presets found.", `Add at least one theme preset JSON under ${config.themeDir}.`);
    }
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

  if (!nodeModulesExists) {
    record(
      "warn",
      "Render validation",
      "Skipped because dependencies are not installed yet.",
      "Install dependencies, then rerun npm run doctor or npm run validate.",
    );
  } else {
    try {
      const { renderCatalog } = await loadEngineForWorkspace();
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
    await initWorkspace(args[0] || ".");
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

  if (command === "upgrade") {
    const action = args[0];

    if (action === "check") {
      const plan = await applyUpgradePlan(workspaceRoot, { dryRun: true });
      printUpgradeSummary(plan);
      if (plan.conflicts.length > 0) {
        console.log("");
        console.log("Conflicts:");
        for (const conflict of plan.conflicts) {
          console.log(`- ${conflict.targetPath}`);
        }
      }
      return;
    }

    if (action === "apply") {
      const dryRun = args.includes("--dry-run");
      const plan = await applyUpgradePlan(workspaceRoot, { dryRun });
      printUpgradeSummary(plan);
      if (dryRun) {
        console.log("");
        console.log("Dry run only. Re-run without --dry-run to write backups and apply safe updates.");
        return;
      }
      if (plan.backupId) {
        console.log("");
        console.log(`Backup created: ${path.join(workspaceBackupsDir, plan.backupId)}`);
      }
      if (plan.conflicts.length > 0) {
        console.log("Conflicted files were copied into the backup folder under conflicts/ for manual review.");
      }
      return;
    }

    if (action === "rollback") {
      if (!args[1]) {
        throw new Error("Usage: live-prd upgrade rollback <backup-id>");
      }
      const backup = await rollbackUpgrade(workspaceRoot, args[1]);
      console.log(`Rolled back upgrade backup ${backup.id}`);
      return;
    }

    throw new Error("Usage: live-prd upgrade <check|apply|rollback>");
  }

  if (command === "new") {
    if (!args[0]) {
      throw new Error('Usage: live-prd new <slug>');
    }
    await createPrd(args[0]);
    return;
  }

  if (command === "add-demo") {
    const { positional, options } = parseOptionArgs(args);
    if (!positional[0]) {
      throw new Error('Usage: live-prd add-demo <name> [--file <prd>] [--marker <name> | --after-heading <heading> | --before-heading <heading> | --replace-id <id>]');
    }
    await createDemo(positional[0], false, options);
    return;
  }

  if (command === "add-page") {
    const { positional, options } = parseOptionArgs(args);
    if (!positional[0]) {
      throw new Error('Usage: live-prd add-page <name> [--file <prd>] [--marker <name> | --after-heading <heading> | --before-heading <heading> | --replace-id <id>]');
    }
    await createDemo(positional[0], true, options);
    return;
  }

  if (command === "theme-list") {
    const config = await readWorkspaceConfig(workspaceRoot);
    const themes = await listWorkspaceThemes(workspaceRoot, config);
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

  const { config, documents, issues, generatedModulePath } = await syncWorkspaceArtifacts(args[0]);

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

  console.log(`Rendered ${documents.length} PRD document(s).`);
  console.log(`Generated module: ${generatedModulePath}`);
  console.log(`Dist catalog: ${path.join(config.distDir, "catalog.json")}`);

  if (issues.length > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
