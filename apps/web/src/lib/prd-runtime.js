import { marked } from "marked";
import { extractPrdComments } from "../../../../packages/engine/prd-comments.mjs";
import { themeRegistry } from "../runtime-generated/theme-registry.mjs";

const directivePattern = /:::live-(demo|page)\n([\s\S]*?):::/g;
const themes = themeRegistry;

const shadcnDemoTokens = {
  radius: "0.75rem",
  fontHeading:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontBody:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  surface: "oklch(0.985 0 0)",
  surfaceAlt: "oklch(0.97 0 0)",
  panel: "oklch(1 0 0)",
  text: "oklch(0.145 0 0)",
  muted: "oklch(0.556 0 0)",
  primary: "oklch(0.205 0 0)",
  accent: "oklch(0.97 0 0)",
  border: "oklch(0.922 0 0)",
  shadow: "0 1px 2px rgba(15, 23, 42, 0.06), 0 10px 30px rgba(15, 23, 42, 0.04)",
};

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

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {
      frontmatter: {},
      body: markdown,
    };
  }

  const frontmatter = {};
  let activeListField = null;

  for (const line of match[1].split("\n")) {
    const listItem = line.match(/^\s*-\s+(.*)$/);
    if (listItem && activeListField) {
      frontmatter[activeListField].push(listItem[1].trim());
      continue;
    }

    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!field) {
      activeListField = null;
      continue;
    }

    if (field[2] === "") {
      frontmatter[field[1]] = [];
      activeListField = field[1];
    } else {
      frontmatter[field[1]] = field[2].trim();
      activeListField = null;
    }
  }

  return {
    frontmatter,
    body: markdown.slice(match[0].length),
  };
}

function parseDirectiveFields(raw) {
  const fields = {};

  for (const line of raw.split("\n")) {
    const field = line.trim().match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (field) {
      fields[field[1]] = field[2].trim();
    }
  }

  return fields;
}

function createRenderer() {
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

function markdownToHtml(markdown) {
  return marked.parse(markdown, {
    renderer: createRenderer(),
    gfm: true,
  });
}

function extractToc(markdown) {
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

function parseBlocks(markdown) {
  const blocks = [];
  let lastIndex = 0;
  let match;

  while ((match = directivePattern.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, match.index);
    if (before.trim()) {
      blocks.push({
        type: "markdown",
        html: markdownToHtml(before),
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
      height: Number(fields.height ?? (match[1] === "page" ? 840 : 430)),
    });

    lastIndex = match.index + match[0].length;
  }

  const after = markdown.slice(lastIndex);
  if (after.trim()) {
    blocks.push({
      type: "markdown",
      html: markdownToHtml(after),
    });
  }

  return blocks;
}

export function demoThemeVars() {
  const tokens = shadcnDemoTokens;
  return {
    "--prd-radius": tokens.radius,
    "--prd-font-heading": tokens.fontHeading,
    "--prd-font-body": tokens.fontBody,
    "--prd-surface": tokens.surface,
    "--prd-surface-alt": tokens.surfaceAlt,
    "--prd-panel": tokens.panel,
    "--prd-text": tokens.text,
    "--prd-muted": tokens.muted,
    "--prd-primary": tokens.primary,
    "--prd-accent": tokens.accent,
    "--prd-border": tokens.border,
    "--prd-shadow": tokens.shadow,
  };
}

export function parseRuntimeDocument(markdown, fallbackDocument) {
  const { frontmatter, body } = parseFrontmatter(markdown);
  const { bodyMarkdown, comments } = extractPrdComments(body);
  const themeName = frontmatter.theme || fallbackDocument.theme?.name || fallbackDocument.meta.theme;
  const theme = themes[themeName] || fallbackDocument.theme;

  return {
    slug: frontmatter.slug || fallbackDocument.slug,
    file: fallbackDocument.file,
    meta: {
      ...fallbackDocument.meta,
      ...frontmatter,
    },
    toc: extractToc(bodyMarkdown),
    theme,
    comments,
    markdown,
    blocks: parseBlocks(bodyMarkdown),
  };
}
