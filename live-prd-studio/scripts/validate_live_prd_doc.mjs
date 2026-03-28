#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const inputPath = args[0];

if (!inputPath) {
  console.error("Usage: node validate_live_prd_doc.mjs <prd-markdown-file>");
  process.exit(1);
}

const requiredFrontmatter = ["title", "slug", "owner", "status", "summary"];
const requiresRoute = new Set(["live-page"]);

function extractFrontmatter(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return null;
  }

  const entries = {};
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (field) {
      entries[field[1]] = field[2];
    }
  }

  return entries;
}

function extractDirectiveMaps(source) {
  const blocks = [];
  const pattern = /:::live-(demo|page)\n([\s\S]*?):::/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const kind = `live-${match[1]}`;
    const fields = {};

    for (const line of match[2].split("\n")) {
      const field = line.trim().match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (field) {
        fields[field[1]] = field[2];
      }
    }

    blocks.push({ kind, fields });
  }

  return blocks;
}

async function main() {
  const absolutePath = path.resolve(process.cwd(), inputPath);
  const source = await readFile(absolutePath, "utf8");
  const issues = [];

  const frontmatter = extractFrontmatter(source);
  if (!frontmatter) {
    issues.push("Missing YAML frontmatter.");
  } else {
    for (const field of requiredFrontmatter) {
      if (!frontmatter[field]) {
        issues.push(`Missing frontmatter field: ${field}`);
      }
    }
  }

  if (!source.includes("## Acceptance Criteria")) {
    issues.push('Missing required section heading: "## Acceptance Criteria"');
  }

  const directives = extractDirectiveMaps(source);
  for (const directive of directives) {
    if (!directive.fields.id) {
      issues.push(`Directive ${directive.kind} is missing "id".`);
    }
    if (!directive.fields.source) {
      issues.push(`Directive ${directive.kind} is missing "source".`);
    }
    if (requiresRoute.has(directive.kind) && !directive.fields.route) {
      issues.push(`Directive ${directive.kind} is missing "route".`);
    }
  }

  if (issues.length > 0) {
    console.error(`Validation failed for ${absolutePath}`);
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log(`Validation passed for ${absolutePath}`);
  console.log(`Detected ${directives.length} live directive(s).`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
