import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
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

function versionSlugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "version";
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
  const config = JSON.parse(raw);
  return {
    versionDir: "docs/prd/.versions",
    ...config,
  };
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
  const targetPath = path.join(projectRoot, config.generatedModule);
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

function getVersionRoot(projectRoot, config, slug) {
  return path.join(projectRoot, config.versionDir, slug);
}

function getVersionManifestPath(projectRoot, config, slug) {
  return path.join(getVersionRoot(projectRoot, config, slug), "manifest.json");
}

async function readJsonIfExists(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

async function ensureVersionRoot(projectRoot, config, slug) {
  const versionRoot = getVersionRoot(projectRoot, config, slug);
  await mkdir(versionRoot, { recursive: true });
  return versionRoot;
}

async function loadVersionManifest(projectRoot, config, slug) {
  const manifestPath = getVersionManifestPath(projectRoot, config, slug);
  const manifest = await readJsonIfExists(manifestPath, { versions: [] });
  return {
    versions: Array.isArray(manifest.versions) ? manifest.versions : [],
  };
}

async function saveVersionManifest(projectRoot, config, slug, manifest) {
  const manifestPath = getVersionManifestPath(projectRoot, config, slug);
  await ensureVersionRoot(projectRoot, config, slug);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function createSourceVersion(document, fileStats) {
  return {
    id: `source:${document.slug}`,
    kind: "source",
    label: "Source",
    archived: false,
    markdown: document.markdown,
    file: document.file,
    createdAt: fileStats.birthtime.toISOString(),
    updatedAt: fileStats.mtime.toISOString(),
  };
}

export async function loadFileVersionState(projectRoot, slug) {
  const config = await loadConfig(projectRoot);
  const document = await renderPrdBySlug(projectRoot, slug);
  const sourceFile = path.join(projectRoot, document.file);
  const sourceStats = await stat(sourceFile);
  const manifest = await loadVersionManifest(projectRoot, config, slug);
  const versionRoot = getVersionRoot(projectRoot, config, slug);

  const storedVersions = await Promise.all(
    manifest.versions.map(async (entry) => {
      const absolutePath = path.join(versionRoot, entry.fileName);

      try {
        const [markdown, fileStats] = await Promise.all([
          readFile(absolutePath, "utf8"),
          stat(absolutePath),
        ]);

        return {
          id: entry.id,
          kind: "version",
          label: entry.label,
          archived: Boolean(entry.archived),
          markdown,
          file: path.relative(projectRoot, absolutePath),
          fileName: entry.fileName,
          createdAt: entry.createdAt || fileStats.birthtime.toISOString(),
          updatedAt: fileStats.mtime.toISOString(),
        };
      } catch (error) {
        if (error?.code === "ENOENT") {
          return null;
        }

        throw error;
      }
    }),
  );

  return {
    slug,
    sourceFile: document.file,
    versions: [
      createSourceVersion(document, sourceStats),
      ...storedVersions.filter(Boolean),
    ],
  };
}

function ensureUniqueFileName(existingEntries, baseName) {
  const existing = new Set(existingEntries.map((entry) => entry.fileName));
  if (!existing.has(`${baseName}.md`)) {
    return `${baseName}.md`;
  }

  let index = 2;
  while (existing.has(`${baseName}-${index}.md`)) {
    index += 1;
  }

  return `${baseName}-${index}.md`;
}

export async function saveFileVersion(projectRoot, slug, { versionId = null, label, markdown }) {
  const config = await loadConfig(projectRoot);
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) {
    throw new Error("Version name is required.");
  }

  await ensureVersionRoot(projectRoot, config, slug);
  const manifest = await loadVersionManifest(projectRoot, config, slug);
  const versionRoot = getVersionRoot(projectRoot, config, slug);
  const now = new Date().toISOString();
  const existingEntry = versionId
    ? manifest.versions.find((entry) => entry.id === versionId)
    : null;

  if (existingEntry) {
    await writeFile(path.join(versionRoot, existingEntry.fileName), markdown, "utf8");
    existingEntry.label = cleanLabel;
    existingEntry.updatedAt = now;
  } else {
    const nextId = `version:${Date.now()}`;
    const fileName = ensureUniqueFileName(manifest.versions, versionSlugify(cleanLabel));
    await writeFile(path.join(versionRoot, fileName), markdown, "utf8");
    manifest.versions.unshift({
      id: nextId,
      label: cleanLabel,
      archived: false,
      fileName,
      createdAt: now,
      updatedAt: now,
    });
  }

  await saveVersionManifest(projectRoot, config, slug, manifest);
  return loadFileVersionState(projectRoot, slug);
}

export async function archiveFileVersion(projectRoot, slug, versionId) {
  const config = await loadConfig(projectRoot);
  const manifest = await loadVersionManifest(projectRoot, config, slug);
  const target = manifest.versions.find((entry) => entry.id === versionId);

  if (!target) {
    throw new Error("Version not found.");
  }

  target.archived = true;
  target.updatedAt = new Date().toISOString();
  await saveVersionManifest(projectRoot, config, slug, manifest);
  return loadFileVersionState(projectRoot, slug);
}

export async function deleteFileVersion(projectRoot, slug, versionId) {
  const config = await loadConfig(projectRoot);
  const manifest = await loadVersionManifest(projectRoot, config, slug);
  const target = manifest.versions.find((entry) => entry.id === versionId);

  if (!target) {
    throw new Error("Version not found.");
  }

  manifest.versions = manifest.versions.filter((entry) => entry.id !== versionId);
  await rm(path.join(getVersionRoot(projectRoot, config, slug), target.fileName), {
    force: true,
  });
  await saveVersionManifest(projectRoot, config, slug, manifest);
  return loadFileVersionState(projectRoot, slug);
}
