import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";
import { marked } from "marked";
import { appendPrdComment, deletePrdComment, updatePrdComment } from "./prd-comments.mjs";

const requiredFrontmatter = ["title", "slug", "owner", "status", "summary"];
const liveDirectivePattern = /:::live-(demo|page)\n([\s\S]*?):::/g;

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function createHeadingIdFactory() {
  const seen = new Map();

  return (value) => {
    const base = slugify(value) || "section";
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  };
}

function normalizeHeadingText(value) {
  return String(value)
    .normalize("NFKC")
    .trim()
    .toLowerCase();
}

function hasSectionHeading(markdown, labels) {
  const allowed = labels.map(normalizeHeadingText);
  const pattern = /^(#{2,6})\s+(.+?)\s*$/gm;
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    if (allowed.includes(normalizeHeadingText(match[2]))) {
      return true;
    }
  }

  return false;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function highlightCode(text, lang) {
  const escaped = escapeHtml(text);
  const normalized = String(lang || "").toLowerCase();

  if (["js", "jsx", "ts", "tsx", "json"].includes(normalized)) {
    return escaped
      .replace(/(\/\/.*$)/gm, '<span class="tok-comment">$1</span>')
      .replace(/("(?:\\.|[^"])*"|'(?:\\.|[^'])*')/g, '<span class="tok-string">$1</span>')
      .replace(/\b(const|let|var|return|if|else|function|export|import|from|await|async|new|true|false|null|undefined|class|extends|try|catch|throw)\b/g, '<span class="tok-keyword">$1</span>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-number">$1</span>');
  }

  if (["bash", "sh", "shell", "zsh"].includes(normalized)) {
    return escaped
      .replace(/(#.*$)/gm, '<span class="tok-comment">$1</span>')
      .replace(/("(?:\\.|[^"])*"|'(?:\\.|[^'])*')/g, '<span class="tok-string">$1</span>')
      .replace(/\b(npm|bun|node|git|cd|ls|cp|mv|rm|cat|echo)\b/g, '<span class="tok-keyword">$1</span>');
  }

  return escaped;
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
  const nextHeadingId = createHeadingIdFactory();

  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((token) => token.text ?? "").join("");
    const id = nextHeadingId(text);
    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  renderer.code = ({ text, lang }) => {
    const language = String(lang || "").trim();
    return `<div class="prd-code-block"><div class="prd-code-head"><span>${escapeHtml(language || "text")}</span></div><pre><code class="${language ? `language-${escapeHtml(language)}` : ""}">${highlightCode(text, language)}</code></pre></div>`;
  };

  renderer.blockquote = ({ tokens }) =>
    `<blockquote>${marked.parser(tokens)}</blockquote>`;
  renderer.hr = () => "<hr />";
  renderer.image = ({ href, text, title }) =>
    `<img alt="${escapeHtml(text || "")}" loading="lazy" src="${escapeHtml(href || "")}"${title ? ` title="${escapeHtml(title)}"` : ""} />`;

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
  const nextHeadingId = createHeadingIdFactory();
  let match;

  while ((match = pattern.exec(markdown)) !== null) {
    toc.push({
      depth: match[1].length,
      text: match[2].trim(),
      id: nextHeadingId(match[2]),
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
  const liveBlockIds = new Set();

  for (const field of requiredFrontmatter) {
    if (!document.meta?.[field]) {
      issues.push(`Missing frontmatter field "${field}" in ${document.file}.`);
    }
  }

  if (!hasSectionHeading(document.rawBody, ["Acceptance Criteria", "验收标准"])) {
    issues.push(`Missing "## Acceptance Criteria" or "## 验收标准" section in ${document.file}.`);
  }

  for (const block of document.blocks) {
    if (block.type === "live-demo" || block.type === "live-page") {
      if (!block.id) {
        issues.push(`Live block missing "id" in ${document.file}.`);
      } else {
        if (liveBlockIds.has(block.id)) {
          issues.push(`Duplicate live block id "${block.id}" in ${document.file}.`);
        }
        liveBlockIds.add(block.id);
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
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanMarkdownFiles(absolutePath)));
    } else if (entry.isFile() && absolutePath.endsWith(".md")) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

async function scanFiles(directory, predicate) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanFiles(absolutePath, predicate)));
      continue;
    }

    if (entry.isFile() && predicate(absolutePath)) {
      files.push(absolutePath);
    }
  }

  return files.sort();
}

function toModuleImportPath(fromFile, toFile, suffix = "") {
  let relativePath = path.relative(path.dirname(fromFile), toFile).split(path.sep).join("/");
  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return `${relativePath}${suffix}`;
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
    markdown: raw,
    rawBody: parsed.content,
    blocks,
  };
}

export async function renderPrdBySlug(projectRoot, slug) {
  const config = await loadConfig(projectRoot);
  const files = await listPrdFiles(projectRoot, config);
  const targetFile = files.find((file) => path.basename(file, ".md") === slug);

  if (!targetFile) {
    throw new Error(`Could not find PRD for slug "${slug}".`);
  }

  return renderPrdFile(projectRoot, config, targetFile);
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
  const targetPath = path.join(projectRoot, config.generatedModule || ".live-prd/generated/prd-data.mjs");
  await mkdir(path.dirname(targetPath), { recursive: true });

  const payload = JSON.stringify(
    documents.map((document) => ({
      file: document.file,
      slug: document.slug,
      meta: document.meta,
      toc: document.toc,
      theme: document.theme,
      markdown: document.markdown,
      blocks: document.blocks,
    })),
    null,
    2,
  );

  const source = `export const prdCatalog = ${payload};\nexport const defaultPrdSlug = prdCatalog[0]?.slug ?? "";\nexport default prdCatalog;\n`;
  await writeFile(targetPath, source, "utf8");
}

export async function writeRuntimeGeneratedModules(projectRoot, runtimeRoot, config, documents) {
  const generatedRoot = path.join(runtimeRoot, "apps", "web", "src", "runtime-generated");
  await mkdir(generatedRoot, { recursive: true });

  const payload = JSON.stringify(
    documents.map((document) => ({
      file: document.file,
      slug: document.slug,
      meta: document.meta,
      toc: document.toc,
      theme: document.theme,
      markdown: document.markdown,
      blocks: document.blocks,
    })),
    null,
    2,
  );

  await writeFile(
    path.join(generatedRoot, "prd-data.mjs"),
    `export const prdCatalog = ${payload};\nexport const defaultPrdSlug = prdCatalog[0]?.slug ?? "";\nexport default prdCatalog;\n`,
    "utf8",
  );

  const demoRoot = path.join(projectRoot, config.demoDir);
  const demoFiles = await scanFiles(demoRoot, (file) => /\.(js|jsx|ts|tsx)$/.test(file));
  const demoRegistryTarget = path.join(generatedRoot, "demo-registry.mjs");
  const demoLines = [];
  const rawLines = [];
  const demoEntries = [];
  const rawEntries = [];

  for (const [index, absolutePath] of demoFiles.entries()) {
    const relativeDemoPath = `demos/${path.relative(demoRoot, absolutePath).split(path.sep).join("/")}`;
    const moduleName = `demoModule${index}`;
    const rawName = `demoSource${index}`;
    const importPath = toModuleImportPath(demoRegistryTarget, absolutePath);
    demoLines.push(`const ${moduleName} = () => import(${JSON.stringify(importPath)});`);
    rawLines.push(`import ${rawName} from ${JSON.stringify(toModuleImportPath(demoRegistryTarget, absolutePath, "?raw"))};`);
    demoEntries.push(`${JSON.stringify(relativeDemoPath)}: ${moduleName}`);
    rawEntries.push(`${JSON.stringify(relativeDemoPath)}: ${rawName}`);
  }

  await writeFile(
    demoRegistryTarget,
    `${rawLines.join("\n")}${rawLines.length ? "\n" : ""}${demoLines.join("\n")}${demoLines.length ? "\n\n" : ""}export const registry = {\n${demoEntries.map((entry) => `  ${entry},`).join("\n")}\n};\nexport const rawRegistry = {\n${rawEntries.map((entry) => `  ${entry},`).join("\n")}\n};\n`,
    "utf8",
  );

  const themeRoot = path.join(projectRoot, config.themeDir);
  const themeFiles = await scanFiles(themeRoot, (file) => file.endsWith(".json"));
  const themeRegistryTarget = path.join(generatedRoot, "theme-registry.mjs");
  const themeImportLines = [];
  const themeEntries = [];

  for (const [index, absolutePath] of themeFiles.entries()) {
    const importName = `theme${index}`;
    themeImportLines.push(`import ${importName} from ${JSON.stringify(toModuleImportPath(themeRegistryTarget, absolutePath))};`);
    themeEntries.push(`${JSON.stringify(path.basename(absolutePath, ".json"))}: ${importName}`);
  }

  await writeFile(
    themeRegistryTarget,
    `${themeImportLines.join("\n")}${themeImportLines.length ? "\n\n" : ""}export const themeRegistry = {\n${themeEntries.map((entry) => `  ${entry},`).join("\n")}\n};\nexport default themeRegistry;\n`,
    "utf8",
  );
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

export async function addPrdComment(projectRoot, slug, input) {
  const document = await renderPrdBySlug(projectRoot, slug);
  const absolutePath = path.join(projectRoot, document.file);
  const { comment, markdown } = appendPrdComment(document.markdown, input);
  await writeFile(absolutePath, markdown, "utf8");
  return { comment };
}

export async function updatePrdCommentStatus(projectRoot, slug, commentId, status) {
  const document = await renderPrdBySlug(projectRoot, slug);
  const absolutePath = path.join(projectRoot, document.file);
  const { comment, markdown } = updatePrdComment(document.markdown, commentId, { status });
  await writeFile(absolutePath, markdown, "utf8");
  return { comment };
}

export async function removePrdComment(projectRoot, slug, commentId) {
  const document = await renderPrdBySlug(projectRoot, slug);
  const absolutePath = path.join(projectRoot, document.file);
  const { comment, markdown } = deletePrdComment(document.markdown, commentId);
  await writeFile(absolutePath, markdown, "utf8");
  return { comment };
}
