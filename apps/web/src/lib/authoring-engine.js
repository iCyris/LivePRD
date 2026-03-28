const storagePrefix = "live-prd-author-session:";

const sectionRules = [
  {
    title: "Goals",
    keywords: ["goal", "goals", "目标", "收益", "成功", "价值"],
  },
  {
    title: "Non-Goals",
    keywords: ["non-goal", "non goals", "不做", "非目标", "边界"],
  },
  {
    title: "User Flow",
    keywords: ["flow", "journey", "step", "步骤", "流程", "路径"],
  },
  {
    title: "States and Edge Cases",
    keywords: ["edge", "异常", "状态", "失败", "错误", "边界情况", "timeout"],
  },
  {
    title: "Acceptance Criteria",
    keywords: ["acceptance", "验收", "criteria", "done", "完成标准"],
  },
  {
    title: "Live Demo",
    keywords: ["demo", "prototype", "页面", "原型", "组件", "交互"],
  },
  {
    title: "Background",
    keywords: ["背景", "context", "business", "现状"],
  },
];

function storageKey(slug) {
  return `${storagePrefix}${slug}`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeLines(message) {
  return message
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*\d.\s]+/, "").trim());
}

function detectSection(message) {
  const normalized = message.toLowerCase();
  return (
    sectionRules.find((rule) => rule.keywords.some((keyword) => normalized.includes(keyword))) ??
    sectionRules[0]
  );
}

function upsertFrontmatterField(markdown, field, value) {
  if (!markdown.startsWith("---\n")) {
    return markdown;
  }

  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return markdown;
  }

  const current = match[1];
  const nextFrontmatter = current.match(new RegExp(`^${field}:\\s*.*$`, "m"))
    ? current.replace(new RegExp(`^${field}:\\s*.*$`, "m"), `${field}: ${value}`)
    : `${current}\n${field}: ${value}`;

  return markdown.replace(match[0], `---\n${nextFrontmatter}\n---\n`);
}

function upsertSection(markdown, title, lines) {
  const heading = `## ${title}`;
  const isFlow = title === "User Flow";
  const renderedLines = lines.map((line, index) => `${isFlow ? `${index + 1}.` : "-"} ${line}`);
  const pattern = new RegExp(`(^${escapeRegex(heading)}\\n)([\\s\\S]*?)(?=^##\\s|\\Z)`, "m");

  if (pattern.test(markdown)) {
    return markdown.replace(pattern, (match, headingLine, body) => {
      const trimmedBody = body.trimEnd();
      const spacer = trimmedBody ? "\n\n" : "\n";
      return `${headingLine}${trimmedBody}${spacer}${renderedLines.join("\n")}\n\n`;
    });
  }

  const insertionPoint = markdown.match(/^## Acceptance Criteria$/m);
  const block = `\n${heading}\n\n${renderedLines.join("\n")}\n`;
  if (insertionPoint && insertionPoint.index !== undefined) {
    return `${markdown.slice(0, insertionPoint.index)}${block}\n${markdown.slice(insertionPoint.index)}`;
  }

  return `${markdown.trimEnd()}\n${block}\n`;
}

export function createInitialSession(document) {
  return {
    draftMarkdown: document.markdown,
    messages: [
      {
        id: `assistant-${document.slug}`,
        role: "assistant",
        content:
          "把目标、流程、异常、验收或想补的交互状态直接告诉我，我会把内容归类进工作草稿，并实时更新中间的 PRD 预览。",
      },
    ],
  };
}

export function loadSession(document) {
  if (typeof window === "undefined") {
    return createInitialSession(document);
  }

  const stored = window.localStorage.getItem(storageKey(document.slug));
  if (!stored) {
    return createInitialSession(document);
  }

  try {
    return JSON.parse(stored);
  } catch {
    return createInitialSession(document);
  }
}

export function saveSession(slug, session) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey(slug), JSON.stringify(session));
}

export function applyConversationTurn(markdown, message) {
  const summaryMatch = message.match(/(?:摘要|summary)[:：]\s*(.+)$/i);
  if (summaryMatch) {
    const nextMarkdown = upsertFrontmatterField(markdown, "summary", summaryMatch[1].trim());
    return {
      nextMarkdown,
      assistantReply: "我把这段话更新到了 frontmatter 的 `summary`，中间预览已经同步刷新。",
      targetSection: "summary",
    };
  }

  const section = detectSection(message);
  const lines = normalizeLines(message);
  const nextMarkdown = upsertSection(markdown, section.title, lines);

  return {
    nextMarkdown,
    assistantReply: `我已把这段内容归入「${section.title}」并更新工作草稿。你可以继续补充更细的用户流程、异常状态或验收标准。`,
    targetSection: section.title,
  };
}
