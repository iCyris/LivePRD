function createTextWalker(root) {
  return document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent) {
        return NodeFilter.FILTER_REJECT;
      }

      if (
        parent.closest("[data-comment-ui]") ||
        parent.closest("[data-prd-comment-highlight]") ||
        parent.closest("[data-prd-selection-highlight]")
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });
}

function countOccurrences(text, quote) {
  if (!quote) {
    return 0;
  }

  let count = 0;
  let index = 0;

  while ((index = text.indexOf(quote, index)) !== -1) {
    count += 1;
    index += quote.length;
  }

  return count;
}

function unwrap(element) {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
  parent.normalize();
}

function wrapMatch(node, start, length, className, datasetKey, datasetValue) {
  const target = node.splitText(start);
  const remainder = target.splitText(length);
  const highlight = document.createElement("mark");
  highlight.className = className;
  highlight.dataset[datasetKey] = datasetValue;
  highlight.textContent = target.nodeValue;
  target.parentNode.replaceChild(highlight, target);
  remainder.parentNode?.normalize();
  return highlight;
}

export function clearCommentHighlights(root) {
  if (!root) {
    return;
  }

  root.querySelectorAll("[data-prd-comment-highlight]").forEach((element) => {
    unwrap(element);
  });
}

export function applyCommentHighlights(root, comments) {
  if (!root) {
    return [];
  }

  clearCommentHighlights(root);
  const applied = [];

  for (const comment of comments) {
    const quote = String(comment.quote || "");
    if (!quote) {
      continue;
    }

    const walker = createTextWalker(root);
    let node = walker.nextNode();
    let remaining = Number.isFinite(Number(comment.occurrence))
      ? Number(comment.occurrence)
      : 0;

    while (node) {
      let searchIndex = 0;

      while (searchIndex < node.nodeValue.length) {
        const matchIndex = node.nodeValue.indexOf(quote, searchIndex);
        if (matchIndex === -1) {
          break;
        }

        if (remaining === 0) {
          const element = wrapMatch(
            node,
            matchIndex,
            quote.length,
            `prd-comment-anchor${comment.status === "resolved" ? " prd-comment-anchor--resolved" : ""}`,
            "prdCommentHighlight",
            comment.id,
          );
          applied.push({
            id: comment.id,
            element,
          });
          node = null;
          break;
        }

        remaining -= 1;
        searchIndex = matchIndex + quote.length;
      }

      node = node ? walker.nextNode() : null;
    }
  }

  return applied;
}

export function clearSelectionDraftHighlight(root) {
  if (!root) {
    return;
  }

  root.querySelectorAll("[data-prd-selection-highlight]").forEach((element) => {
    unwrap(element);
  });
}

export function applySelectionDraftHighlight(root, draft) {
  if (!root || !draft?.quote) {
    return null;
  }

  clearSelectionDraftHighlight(root);
  const quote = String(draft.quote || "");
  const walker = createTextWalker(root);
  let node = walker.nextNode();
  let remaining = Number.isFinite(Number(draft.occurrence))
    ? Number(draft.occurrence)
    : 0;

  while (node) {
    let searchIndex = 0;

    while (searchIndex < node.nodeValue.length) {
      const matchIndex = node.nodeValue.indexOf(quote, searchIndex);
      if (matchIndex === -1) {
        break;
      }

      if (remaining === 0) {
        return wrapMatch(
          node,
          matchIndex,
          quote.length,
          "prd-selection-anchor",
          "prdSelectionHighlight",
          "true",
        );
      }

      remaining -= 1;
      searchIndex = matchIndex + quote.length;
    }

    node = walker.nextNode();
  }

  return null;
}

export function getSelectionCommentDraft(root, selection) {
  if (!root || !selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) {
    return null;
  }

  if (
    range.startContainer !== range.endContainer ||
    range.startContainer.nodeType !== Node.TEXT_NODE
  ) {
    return null;
  }

  const quote = selection.toString().replace(/^\s+|\s+$/g, "");
  if (!quote) {
    return null;
  }

  const walker = createTextWalker(root);
  let node = walker.nextNode();
  let occurrence = 0;

  while (node) {
    if (node === range.startContainer) {
      occurrence += countOccurrences(node.nodeValue.slice(0, range.startOffset), quote);
      break;
    }

    occurrence += countOccurrences(node.nodeValue, quote);
    node = walker.nextNode();
  }

  const rect = range.getBoundingClientRect();
  return {
    quote,
    occurrence,
    rect: {
      left: rect.left + rect.width / 2,
      top: rect.top,
      bottom: rect.bottom,
    },
  };
}
