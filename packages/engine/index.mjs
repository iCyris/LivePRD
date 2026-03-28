import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { marked } from "marked";

const requiredFrontmatter = ["title", "slug", "owner", "status", "summary"];
const liveDirectivePattern = /:::live-(demo|page)\n([\s\S]*?):::/g;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function createMarkedRenderer() {
  const renderer = new marked.Renderer();

  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((token) => token.text ?? "").join("");
    const id = slugify(text);
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  return renderer;
}

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function markdownToHtml(markdown) {
  return marked.parse(markdown, {
    renderer: createMarkedRenderer(),
  });
}

export function extractToc(markdown) {
  const toc = [];
  const pattern = /^(##|###)\s+(.+)$/gm;
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    toc.push({
      depth: match[1].length,
      text: match[2].trim(),
      id: slugify(match[2]),
    });
  }

  return toc;
}

export function parseBodyBlocks(markdown) {
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = liveDirectivePattern.exec(markdown)) !== null) {
    const markdownBefore = markdown.slice(lastIndex, match.index);
    if (markdownBefore.trim()) {
      blocks.push({
        type: "markdown",
        html: markdownToHtml(markdownBefore),
      });
    }

    const fields = parseDirectiveFields(match[2]);
    blocks.push({
      type: `live-${match[1]}`,
      id: fields.id ?? "",
      source: fields.source ?? "",
      route: fields.route ?? "",
      theme: fields.theme ?? "",
      caption: fields.caption ?? "",
      height: Number(fields.height ?? (match[1] === "page" ? 760 : 420)),
    });

    lastIndex = match.index + match[0].length;
  }

  const markdownAfter = markdown.slice(lastIndex);
  if (markdownAfter.trim()) {
    blocks.push({
      type: "markdown",
      html: markdownToHtml(markdownAfter),
    });
  }

  return blocks;
}

export function validatePrdDocument(document) {
  const issues = [];

  for (const field of requiredFrontmatter) {
    if (!document.meta?.[field]) {
      issues.push(`Missing frontmatter field "${field}" in ${document.file}.`);
    }
  }

  if (!document.rawBody.includes("## Acceptance Criteria")) {
    issues.push(`Missing "## Acceptance Criteria" section in ${document.file}.`);
  }

  for (const block of document.blocks) {
    if (block.type === "live-demo" || block.type === "live-page") {
      if (!block.id) {
        issues.push(`Live block missing "id" in ${document.file}.`);
      }
      if (!block.source) {
        issues.push(`Live block missing "source" in ${document.file}.`);
      }
      if (block.type === "live-page" && !block.route) {
        issues.push(`Live page "${block.id || "unknown"}" missing "route" in ${document.file}.`);
      }
    }
  }

  return issues;
}

export async function loadConfig(projectRoot) {
  const configPath = path.join(projectRoot, "live-prd.config.json");
  const raw = await readFile(configPath, "utf8");
  return JSON.parse(raw);
}

async function scanMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanMarkdownFiles(absolutePath)));
    } else if (entry.isFile() && absolutePath.endsWith(".md")) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

export async function listPrdFiles(projectRoot, config) {
  return scanMarkdownFiles(path.join(projectRoot, config.contentDir));
}

export async function loadTheme(projectRoot, config, themeName) {
  const themePath = path.join(projectRoot, config.themeDir, `${themeName}.json`);
  const raw = await readFile(themePath, "utf8");
  return JSON.parse(raw);
}

export async function listThemes(projectRoot, config) {
  const themeRoot = path.join(projectRoot, config.themeDir);
  const entries = await readdir(themeRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name.replace(/\.json$/, ""))
    .sort();
}

export async function renderPrdFile(projectRoot, config, absoluteFilePath) {
  const raw = await readFile(absoluteFilePath, "utf8");
  const parsed = matter(raw);
  const themeName = parsed.data.theme || config.defaultTheme;
  const theme = await loadTheme(projectRoot, config, themeName);
  const relativeFile = path.relative(projectRoot, absoluteFilePath);
  const toc = extractToc(parsed.content);
  const blocks = parseBodyBlocks(parsed.content);

  return {
    file: relativeFile,
    slug: parsed.data.slug || slugify(path.basename(absoluteFilePath, ".md")),
    meta: parsed.data,
    toc,
    theme,
    rawBody: parsed.content,
    blocks,
  };
}

export async function renderCatalog(projectRoot, specificFile = null) {
  const config = await loadConfig(projectRoot);
  const files = specificFile
    ? [path.resolve(projectRoot, specificFile)]
    : await listPrdFiles(projectRoot, config);

  const documents = [];
  const issues = [];

  for (const file of files) {
    const document = await renderPrdFile(projectRoot, config, file);
    documents.push(document);
    issues.push(...validatePrdDocument(document));
  }

  return {
    config,
    documents,
    issues,
  };
}

export async function writeGeneratedModule(projectRoot, config, documents) {
  const targetPath = path.join(projectRoot, config.generatedModule);
  await mkdir(path.dirname(targetPath), { recursive: true });

  const payload = JSON.stringify(
    documents.map((document) => ({
      file: document.file,
      slug: document.slug,
      meta: document.meta,
      toc: document.toc,
      theme: document.theme,
      blocks: document.blocks,
    })),
    null,
    2,
  );

  const source = `export const prdCatalog = ${payload};\nexport const defaultPrdSlug = prdCatalog[0]?.slug ?? "";\nexport default prdCatalog;\n`;
  await writeFile(targetPath, source, "utf8");
}

export async function writeDistArtifacts(projectRoot, config, documents) {
  const distRoot = path.join(projectRoot, config.distDir);
  await mkdir(distRoot, { recursive: true });

  const manifestPath = path.join(distRoot, "catalog.json");
  await writeFile(
    manifestPath,
    `${JSON.stringify(documents, null, 2)}\n`,
    "utf8",
  );
}
