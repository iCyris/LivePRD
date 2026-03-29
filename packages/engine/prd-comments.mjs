const commentBlockPattern = /\n*<!--\s*live-prd-comments\s*\n([\s\S]*?)\n-->\s*$/;

function normalizeComment(input, fallbackId) {
  const createdAt = input.createdAt || new Date().toISOString();
  const updatedAt = input.updatedAt || createdAt;
  const status = input.status === "resolved" ? "resolved" : "open";

  return {
    id: String(input.id || fallbackId),
    quote: String(input.quote || "").trim(),
    occurrence: Number.isFinite(Number(input.occurrence)) ? Number(input.occurrence) : 0,
    body: String(input.body || "").trim(),
    status,
    createdAt,
    updatedAt,
    resolvedAt:
      status === "resolved"
        ? input.resolvedAt || updatedAt
        : null,
  };
}

function parseCommentPayload(payload, options = {}) {
  if (!payload.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(payload);
    if (!Array.isArray(parsed)) {
      throw new Error("Comment payload must be an array.");
    }

    return parsed
      .map((item, index) => normalizeComment(item, `comment-${index + 1}`))
      .filter((comment) => comment.quote && comment.body);
  } catch (error) {
    if (options.throwOnInvalid) {
      throw new Error("Invalid live-prd-comments block JSON.");
    }

    return [];
  }
}

export function extractPrdComments(markdown, options = {}) {
  const match = markdown.match(commentBlockPattern);
  if (!match) {
    return {
      bodyMarkdown: markdown,
      comments: [],
    };
  }

  return {
    bodyMarkdown: markdown.slice(0, match.index).replace(/\s*$/, "\n"),
    comments: parseCommentPayload(match[1], options),
  };
}

export function serializePrdComments(markdown, comments) {
  const { bodyMarkdown } = extractPrdComments(markdown);
  const normalizedBody = bodyMarkdown.replace(/\s*$/, "");
  const normalizedComments = comments
    .map((comment, index) => normalizeComment(comment, `comment-${index + 1}`))
    .filter((comment) => comment.quote && comment.body);

  if (normalizedComments.length === 0) {
    return normalizedBody ? `${normalizedBody}\n` : "";
  }

  return `${normalizedBody}\n\n<!-- live-prd-comments\n${JSON.stringify(normalizedComments, null, 2)}\n-->\n`;
}

export function appendPrdComment(markdown, input) {
  const { comments } = extractPrdComments(markdown, { throwOnInvalid: true });
  const now = new Date().toISOString();
  const comment = normalizeComment(
    {
      ...input,
      id: input.id || `comment-${Date.now()}`,
      status: "open",
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
    },
    `comment-${Date.now()}`,
  );

  return {
    comment,
    markdown: serializePrdComments(markdown, [...comments, comment]),
  };
}

export function updatePrdComment(markdown, commentId, updates) {
  const { comments } = extractPrdComments(markdown, { throwOnInvalid: true });
  const index = comments.findIndex((comment) => comment.id === commentId);

  if (index === -1) {
    throw new Error(`Could not find comment "${commentId}".`);
  }

  const current = comments[index];
  const nextStatus = updates.status === "resolved" ? "resolved" : "open";
  const updatedAt = new Date().toISOString();
  const nextComment = normalizeComment(
    {
      ...current,
      ...updates,
      status: nextStatus,
      updatedAt,
      resolvedAt: nextStatus === "resolved" ? updates.resolvedAt || updatedAt : null,
    },
    current.id,
  );

  const nextComments = comments.slice();
  nextComments[index] = nextComment;

  return {
    comment: nextComment,
    markdown: serializePrdComments(markdown, nextComments),
  };
}

export function deletePrdComment(markdown, commentId) {
  const { comments } = extractPrdComments(markdown, { throwOnInvalid: true });
  const target = comments.find((comment) => comment.id === commentId);

  if (!target) {
    throw new Error(`Could not find comment "${commentId}".`);
  }

  if (target.status !== "resolved") {
    throw new Error("Only resolved comments can be deleted.");
  }

  return {
    comment: target,
    markdown: serializePrdComments(
      markdown,
      comments.filter((comment) => comment.id !== commentId),
    ),
  };
}
