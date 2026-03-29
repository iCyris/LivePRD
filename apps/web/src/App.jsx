import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  Expand,
  FileCode2,
  FileText,
  Info,
  MessageSquare,
  Minimize,
  Plus,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

import prdCatalogFallback, { defaultPrdSlug as defaultPrdSlugFallback } from "./runtime-generated/prd-data.mjs";
import { LanguageToggle } from "./components/LanguageToggle.jsx";
import { LiveBlock } from "./components/LiveBlock.jsx";
import { ModeToggle } from "./components/ModeToggle.jsx";
import { ToolbarMenu } from "./components/ToolbarMenu.jsx";
import { Badge } from "./components/ui/badge.jsx";
import { Button } from "./components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.jsx";
import { getDemoSourceCode } from "./demo-registry.js";
import {
  createPrdComment,
  deletePrdComment as removePersistedComment,
  fetchPrdCatalog,
  updatePrdCommentStatus as persistCommentStatus,
} from "./lib/file-authoring.js";
import {
  applyCommentHighlights,
  clearCommentHighlights,
  getSelectionCommentDraft,
} from "./lib/comment-highlights.js";
import { useLanguagePreference } from "./lib/i18n.js";
import { renderMermaidBlocks } from "./lib/mermaid.js";
import { demoThemeVars, parseRuntimeDocument } from "./lib/prd-runtime.js";
import { exportDemoBundle, exportMarkdownFile, exportShareHtml } from "./lib/share-export.js";
import { useThemePreference } from "./lib/theme.js";

function documentFromSlug(slug, catalog) {
  return catalog.find((item) => item.slug === slug) ?? catalog[0] ?? null;
}

function readDocSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("doc") || defaultPrdSlugFallback;
}

function writeDocSlugToUrl(slug) {
  const url = new URL(window.location.href);
  url.searchParams.set("doc", slug);
  window.history.replaceState({}, "", url);
}

function orderComments(comments) {
  return [...comments].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "open" ? -1 : 1;
    }

    return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
  });
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const COMMENT_POPOVER_WIDTH = 320;
const COMMENT_POPOVER_HEIGHT = 188;
const COMMENT_POPOVER_GAP = 6;

function createCatalogSignature(catalog) {
  return JSON.stringify(
    (catalog || []).map((item) => ({
      slug: item.slug,
      file: item.file,
      markdown: item.markdown,
      meta: item.meta,
    })),
  );
}

export default function App() {
  const [isSourceVisible, setIsSourceVisible] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("live-prd-editor-visible") === "true";
  });
  const [colorMode, setColorMode] = useThemePreference();
  const [locale, setLocale, copy] = useLanguagePreference();
  const [prdCatalog, setPrdCatalog] = useState(prdCatalogFallback);
  const [activeSlug, setActiveSlug] = useState(readDocSlugFromUrl());
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [tocCollapsed, setTocCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("live-prd-toc-collapsed") === "true";
  });
  const [areCommentsVisible, setAreCommentsVisible] = useState(true);
  const [selectionDraft, setSelectionDraft] = useState(null);
  const [isCommentComposerOpen, setIsCommentComposerOpen] = useState(false);
  const [pendingDeleteComment, setPendingDeleteComment] = useState(null);
  const [hoveredCommentId, setHoveredCommentId] = useState("");
  const [hoveredCommentRect, setHoveredCommentRect] = useState(null);
  const [commentPopoverHeight, setCommentPopoverHeight] = useState(COMMENT_POPOVER_HEIGHT);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState("");
  const sourceScrollRef = useRef(null);
  const previewScrollRef = useRef(null);
  const previewContentRef = useRef(null);
  const commentPopoverRef = useRef(null);
  const syncingScrollRef = useRef(false);
  const activeScrollSourceRef = useRef("source");
  const syncFrameRef = useRef(null);
  const activeHighlightElementsRef = useRef([]);
  const catalogSignatureRef = useRef(createCatalogSignature(prdCatalogFallback));
  const hoveredCommentStateRef = useRef({
    id: "",
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    bottom: 0,
  });

  const sourceDocument = useMemo(
    () => documentFromSlug(activeSlug, prdCatalog),
    [activeSlug, prdCatalog],
  );
  const deferredMarkdown = useDeferredValue(sourceDocument?.markdown ?? "");
  const prdDocument = useMemo(
    () =>
      sourceDocument
        ? parseRuntimeDocument(deferredMarkdown || sourceDocument.markdown, sourceDocument)
        : null,
    [deferredMarkdown, sourceDocument],
  );
  const stableDemoStyle = useMemo(() => demoThemeVars(), []);
  const referencedDemos = useMemo(
    () =>
      prdDocument?.blocks
        .filter((block) => block.type === "live-demo" || block.type === "live-page")
        .map((block) => block.source)
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index)
        .map((source) => ({
          source,
          code: getDemoSourceCode(source),
        })) ?? [],
    [prdDocument],
  );
  const sortedComments = useMemo(
    () => orderComments(prdDocument?.comments ?? []),
    [prdDocument?.comments],
  );
  const hoveredComment = useMemo(
    () => sortedComments.find((comment) => comment.id === hoveredCommentId) ?? null,
    [hoveredCommentId, sortedComments],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("live-prd-editor-visible", String(isSourceVisible));
  }, [isSourceVisible]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("live-prd-toc-collapsed", String(tocCollapsed));
  }, [tocCollapsed]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveSlug(readDocSlugFromUrl());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const nextCatalog = await fetchPrdCatalog();
        if (!cancelled && nextCatalog.length > 0) {
          const nextSignature = createCatalogSignature(nextCatalog);
          if (nextSignature === catalogSignatureRef.current) {
            return;
          }

          catalogSignatureRef.current = nextSignature;
          setPrdCatalog(nextCatalog);
        }
      } catch {
        if (!cancelled) {
          catalogSignatureRef.current = createCatalogSignature(prdCatalogFallback);
          setPrdCatalog(prdCatalogFallback);
        }
      }
    };

    loadCatalog();
    const intervalId = window.setInterval(loadCatalog, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (prdCatalog.length === 0) {
      return;
    }

    const nextDocument = documentFromSlug(activeSlug, prdCatalog);
    if (nextDocument && nextDocument.slug !== activeSlug) {
      setActiveSlug(nextDocument.slug);
    }
  }, [activeSlug, prdCatalog]);

  useEffect(() => {
    if (!sourceDocument) {
      return;
    }

    writeDocSlugToUrl(sourceDocument.slug);
  }, [sourceDocument]);

  useEffect(() => {
    document.documentElement.classList.add("app-locked");
    document.body.classList.add("app-locked");

    return () => {
      document.documentElement.classList.remove("app-locked");
      document.body.classList.remove("app-locked");
    };
  }, []);

  useEffect(() => {
    setSelectionDraft(null);
    setIsCommentComposerOpen(false);
    setPendingDeleteComment(null);
    closeCommentPopover();
    setCommentDraft("");
    setCommentError("");
  }, [sourceDocument?.slug]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && pendingDeleteComment) {
        setPendingDeleteComment(null);
        return;
      }

      if (event.key === "Escape" && hoveredCommentId) {
        closeCommentPopover();
        return;
      }

      if (event.key === "Escape" && isPresentationMode) {
        setIsPresentationMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hoveredCommentId, isPresentationMode, pendingDeleteComment]);

  const syncRenderedCommentHighlights = () => {
    const root = previewContentRef.current;
    if (!root) {
      return;
    }

    if (!areCommentsVisible) {
      clearActiveCommentHighlight();
      clearCommentHighlights(root);
      return;
    }

    applyCommentHighlights(root, prdDocument?.comments ?? []);
    if (!hoveredCommentId) {
      clearActiveCommentHighlight();
      return;
    }

    setActiveCommentHighlight(
      [...root.querySelectorAll("[data-prd-comment-highlight]")].filter(
        (element) => element.dataset.prdCommentHighlight === hoveredCommentId,
      ),
    );
  };

  const clearActiveCommentHighlight = () => {
    activeHighlightElementsRef.current.forEach((element) => {
      delete element.dataset.prdCommentActive;
    });
    activeHighlightElementsRef.current = [];
  };

  const setActiveCommentHighlight = (elements) => {
    clearActiveCommentHighlight();

    const nextElements = (Array.isArray(elements) ? elements : [elements]).filter(Boolean);
    if (nextElements.length === 0) {
      return;
    }

    nextElements.forEach((element) => {
      element.dataset.prdCommentActive = "true";
    });
    activeHighlightElementsRef.current = nextElements;
  };

  const closeCommentPopover = () => {
    clearActiveCommentHighlight();
    hoveredCommentStateRef.current = {
      id: "",
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      bottom: 0,
    };
    setHoveredCommentId("");
    setHoveredCommentRect(null);
  };

  useLayoutEffect(() => {
    syncRenderedCommentHighlights();
  });

  useEffect(() => {
    const root = previewContentRef.current;
    if (!root) {
      return undefined;
    }

    let cancelled = false;
    window.requestAnimationFrame(() => {
      renderMermaidBlocks(root).catch((error) => {
        if (!cancelled) {
          console.error("Failed to render mermaid blocks:", error);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [prdDocument?.markdown]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (isCommentComposerOpen) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionDraft(null);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [isCommentComposerOpen]);

  useEffect(() => {
    if (!hoveredCommentId) {
      return undefined;
    }

    const hide = () => {
      closeCommentPopover();
    };

    const previewScroll = previewScrollRef.current;
    previewScroll?.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);

    return () => {
      previewScroll?.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, [hoveredCommentId]);

  useEffect(() => {
    if (!hoveredCommentId) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (
        event.target.closest("[data-comment-popover]") ||
        event.target.closest("[data-prd-comment-highlight]")
      ) {
        return;
      }

      closeCommentPopover();
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [hoveredCommentId]);

  useLayoutEffect(() => {
    if (!hoveredCommentId || !commentPopoverRef.current) {
      return;
    }

    const nextHeight = commentPopoverRef.current.getBoundingClientRect().height;
    if (nextHeight > 0 && Math.abs(nextHeight - commentPopoverHeight) > 1) {
      setCommentPopoverHeight(nextHeight);
    }
  }, [commentPopoverHeight, hoveredComment, hoveredCommentId]);

  useEffect(() => {
    const sourceScroll = sourceScrollRef.current;
    const previewScroll = previewScrollRef.current;

    if (!isSourceVisible || isPresentationMode || !sourceScroll || !previewScroll) {
      return undefined;
    }

    const syncBySource = (source) => {
      if (syncingScrollRef.current || activeScrollSourceRef.current !== source) {
        return;
      }

      const sourceScrollableHeight = sourceScroll.scrollHeight - sourceScroll.clientHeight;
      const previewScrollableHeight = previewScroll.scrollHeight - previewScroll.clientHeight;

      if (sourceScrollableHeight <= 0 || previewScrollableHeight <= 0) {
        return;
      }

      const ratio =
        source === "source"
          ? sourceScroll.scrollTop / sourceScrollableHeight
          : previewScroll.scrollTop / previewScrollableHeight;

      syncingScrollRef.current = true;
      if (source === "source") {
        previewScroll.scrollTop = ratio * previewScrollableHeight;
      } else {
        sourceScroll.scrollTop = ratio * sourceScrollableHeight;
      }

      window.requestAnimationFrame(() => {
        syncingScrollRef.current = false;
      });
    };

    const scheduleSync = (source) => {
      if (syncFrameRef.current) {
        window.cancelAnimationFrame(syncFrameRef.current);
      }

      syncFrameRef.current = window.requestAnimationFrame(() => {
        syncBySource(source);
      });
    };

    const syncPreviewScroll = () => scheduleSync("source");
    const syncSourceScroll = () => scheduleSync("preview");

    sourceScroll.addEventListener("scroll", syncPreviewScroll, { passive: true });
    previewScroll.addEventListener("scroll", syncSourceScroll, { passive: true });
    scheduleSync("source");

    return () => {
      if (syncFrameRef.current) {
        window.cancelAnimationFrame(syncFrameRef.current);
        syncFrameRef.current = null;
      }
      sourceScroll.removeEventListener("scroll", syncPreviewScroll);
      previewScroll.removeEventListener("scroll", syncSourceScroll);
    };
  }, [isPresentationMode, isSourceVisible, prdDocument?.markdown, sourceDocument?.slug]);

  if (!prdDocument || !sourceDocument) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        {copy.noPrdDocuments}
      </main>
    );
  }

  const handleExportMarkdown = () => {
    exportMarkdownFile({
      document: prdDocument,
    });
  };

  const handleExportDemoBundle = () => {
    exportDemoBundle({
      document: prdDocument,
      demos: referencedDemos,
    });
  };

  const handleExportHtml = () => {
    exportShareHtml({
      document: prdDocument,
      element: previewContentRef.current,
    });
  };

  const refreshCatalog = async () => {
    const nextCatalog = await fetchPrdCatalog();
    if (nextCatalog.length > 0) {
      catalogSignatureRef.current = createCatalogSignature(nextCatalog);
      setPrdCatalog(nextCatalog);
    }
  };

  const handlePreviewMouseUp = (event) => {
    if (isCommentComposerOpen) {
      return;
    }

    if (!event.altKey) {
      return;
    }

    if (
      event?.target instanceof Element &&
      event.target.closest("[data-prd-comment-highlight]")
    ) {
      return;
    }

    window.requestAnimationFrame(() => {
      const draft = getSelectionCommentDraft(previewContentRef.current, window.getSelection());
      setSelectionDraft(draft);
      setCommentError("");
    });
  };

  const openCommentPopover = (element) => {
    if (!element) {
      return;
    }

    window.getSelection()?.removeAllRanges();
    setSelectionDraft(null);
    const nextId = element.dataset.prdCommentHighlight || "";
    const rect = element.getBoundingClientRect();
    const nextRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
    };
    const current = hoveredCommentStateRef.current;

    if (current.id === nextId) {
      closeCommentPopover();
      return;
    }

    hoveredCommentStateRef.current = {
      id: nextId,
      ...nextRect,
    };
    setActiveCommentHighlight(element);
    setHoveredCommentId(nextId);
    setHoveredCommentRect(nextRect);
  };

  const openCommentComposer = () => {
    if (!selectionDraft) {
      return;
    }

    setCommentDraft("");
    setCommentError("");
    setIsCommentComposerOpen(true);
  };

  const closeCommentComposer = () => {
    setIsCommentComposerOpen(false);
    setCommentDraft("");
    setCommentError("");
  };

  const handleSaveComment = async () => {
    if (!selectionDraft) {
      setCommentError(copy.commentSelectionHint);
      return;
    }

    if (!commentDraft.trim()) {
      setCommentError(copy.commentBodyRequired);
      return;
    }

    try {
      await createPrdComment(sourceDocument.slug, {
        quote: selectionDraft.quote,
        occurrence: selectionDraft.occurrence,
        body: commentDraft.trim(),
      });
      await refreshCatalog();
      setAreCommentsVisible(true);
      closeCommentComposer();
      setSelectionDraft(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : copy.commentSaveFailed);
    }
  };

  const handleToggleCommentStatus = async (comment) => {
    try {
      closeCommentPopover();
      await persistCommentStatus(
        sourceDocument.slug,
        comment.id,
        comment.status === "resolved" ? "open" : "resolved",
      );
      await refreshCatalog();
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : copy.commentSaveFailed);
    }
  };

  const handleDeleteComment = async (comment) => {
    setPendingDeleteComment(comment);
  };

  const confirmDeleteComment = async () => {
    if (!pendingDeleteComment) {
      return;
    }

    try {
      closeCommentPopover();
      await removePersistedComment(sourceDocument.slug, pendingDeleteComment.id);
      await refreshCatalog();
      setPendingDeleteComment(null);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : copy.commentDeleteFailed);
    }
  };

  const scrollToCommentHighlight = (commentId) => {
    const target = previewContentRef.current?.querySelector(
      `[data-prd-comment-highlight="${commentId}"]`,
    );
    target?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  };

  const selectionButtonStyle = selectionDraft
    ? {
        left: `${Math.max(16, Math.min(window.innerWidth - 164, selectionDraft.rect.left - 72))}px`,
        top: `${Math.max(16, Math.min(window.innerHeight - 56, selectionDraft.rect.bottom + 10))}px`,
      }
    : null;
  const hoveredCommentPopoverStyle = hoveredCommentRect
    ? (() => {
        const previewRect = previewScrollRef.current?.getBoundingClientRect();
        const minTop = previewRect ? previewRect.top + 12 : 16;
        const maxTop = previewRect
          ? Math.max(minTop, previewRect.bottom - commentPopoverHeight - 12)
          : Math.max(16, window.innerHeight - commentPopoverHeight - 16);
        const left = clamp(
          hoveredCommentRect.left + hoveredCommentRect.width / 2 - COMMENT_POPOVER_WIDTH / 2,
          16,
          Math.max(16, window.innerWidth - COMMENT_POPOVER_WIDTH - 16),
        );
        const topAbove = hoveredCommentRect.top - commentPopoverHeight - COMMENT_POPOVER_GAP;
        const topBelow = hoveredCommentRect.bottom + COMMENT_POPOVER_GAP;
        const top = topAbove >= minTop
          ? topAbove
          : clamp(topBelow, minTop, maxTop);

        return {
          left: `${left}px`,
          top: `${top}px`,
        };
      })()
    : null;

  const renderCommentStatusBadge = (comment) => (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-medium ${
        comment.status === "resolved"
          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
          : "bg-amber-500/12 text-amber-700 dark:text-amber-300"
      }`}
    >
      {comment.status === "resolved" ? copy.resolvedStatus : copy.openStatus}
    </span>
  );

  const renderCommentActions = (comment, { compact = false } = {}) => (
    <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2"}`}>
      <Button
        onClick={() => handleToggleCommentStatus(comment)}
        className={
          comment.status === "resolved"
            ? ""
            : "text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
        }
        size="xs"
        type="button"
        variant="ghost"
      >
        {comment.status === "resolved" ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
        {comment.status === "resolved" ? copy.reopenComment : copy.resolveComment}
      </Button>
      {comment.status === "resolved" ? (
        <Button
          onClick={() => handleDeleteComment(comment)}
          size="xs"
          type="button"
          variant="danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {copy.deleteComment}
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header
        className={`z-30 shrink-0 border-b bg-background/94 backdrop-blur supports-[backdrop-filter]:bg-background/78 ${
          isPresentationMode ? "hidden" : ""
        }`}
      >
        <div className="mx-auto flex max-w-[1680px] flex-col gap-1.5 px-3 py-1.5 xl:px-4">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Badge className="bg-secondary text-secondary-foreground">{copy.appBadge}</Badge>
              <h1 className="truncate text-[13px] font-semibold tracking-tight">{prdDocument.meta.title}</h1>
              <Badge className="border-dashed bg-background text-muted-foreground">{prdDocument.meta.status}</Badge>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => setIsSourceVisible((value) => !value)}
                size="sm"
                type="button"
                variant="outline"
              >
                <FileCode2 className="h-4 w-4" />
                {isSourceVisible ? copy.collapseMarkdown : copy.expandMarkdown}
              </Button>

              <ToolbarMenu icon={Share2} label={copy.shareExport}>
                <div className="grid gap-1">
                  <Button
                    className="justify-start"
                    onClick={handleExportMarkdown}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Download className="h-4 w-4" />
                    {copy.exportMarkdown}
                  </Button>
                  <Button
                    className="justify-start"
                    onClick={handleExportDemoBundle}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Download className="h-4 w-4" />
                    {copy.exportDemoBundle}
                  </Button>
                  <Button
                    className="justify-start"
                    onClick={handleExportHtml}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Download className="h-4 w-4" />
                    {copy.exportHtml}
                  </Button>
                </div>
              </ToolbarMenu>

              <ToolbarMenu icon={SlidersHorizontal} label={copy.settings}>
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <p className="px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {copy.language}
                    </p>
                    <LanguageToggle copy={copy} onChange={setLocale} value={locale} />
                  </div>
                  <div className="grid gap-1">
                    <p className="px-1 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {copy.appearance}
                    </p>
                    <ModeToggle copy={copy} onChange={setColorMode} value={colorMode} />
                  </div>
                </div>
              </ToolbarMenu>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] leading-none">
                <span className="text-muted-foreground">{copy.docLabel}</span>
                <span className="relative inline-flex items-center">
                  <select
                    className="h-7 min-w-[220px] appearance-none rounded-md border bg-background pl-2 pr-8 text-[11px] shadow-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
                    onChange={(event) => setActiveSlug(event.target.value)}
                    value={sourceDocument.slug}
                  >
                    {prdCatalog.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.meta.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </span>
              </label>

              <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                <span>{copy.sourceFile}</span>
                <code className="rounded bg-muted/70 px-2 py-1 text-[10px] text-foreground">{sourceDocument.file}</code>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto grid min-h-0 w-full flex-1 overflow-hidden ${
          isPresentationMode
            ? "max-w-none grid-cols-[minmax(0,1fr)] px-0 py-0"
            : isSourceVisible
              ? "max-w-[1680px] gap-2.5 px-3 py-2.5 xl:grid-cols-[minmax(320px,0.66fr)_minmax(0,1.54fr)] xl:px-4"
              : "max-w-[1680px] grid-cols-[minmax(0,1fr)] px-3 py-2.5 xl:px-4"
        }`}
      >
        <Card
          className={`min-h-0 overflow-hidden border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.025)] ${
            isPresentationMode || !isSourceVisible ? "hidden" : ""
          }`}
        >
          <CardHeader className="border-b bg-muted/15 px-3 py-2">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode2 className="h-4 w-4" />
                {copy.sourceTitle}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-68px)] p-0">
            <textarea
              ref={sourceScrollRef}
              readOnly
              className="fine-scrollbar h-full w-full resize-none border-0 bg-background px-3 py-2.5 font-mono text-[11px] leading-5 outline-none"
              onFocus={() => {
                activeScrollSourceRef.current = "source";
              }}
              onMouseEnter={() => {
                activeScrollSourceRef.current = "source";
              }}
              value={sourceDocument.markdown}
            />
          </CardContent>
        </Card>

        <section className="grid min-h-0">
          <Card
            className={`relative min-h-0 overflow-hidden ${
              isPresentationMode
                ? "rounded-none border-0 shadow-none"
                : "border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.025)]"
            }`}
          >
            <CardHeader
              className={`border-b bg-muted/10 px-4 py-2 ${
                isPresentationMode ? "hidden" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  {copy.renderTitle}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => setAreCommentsVisible((value) => !value)}
                    size="xs"
                    type="button"
                    variant={areCommentsVisible ? "outline" : "ghost"}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {areCommentsVisible ? copy.commentsHidden : copy.comments}
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
                      {sortedComments.length}
                    </span>
                  </Button>
                  <Button
                    onClick={() => setIsPresentationMode((value) => !value)}
                    size="xs"
                    type="button"
                    variant="ghost"
                  >
                    {isPresentationMode ? <Minimize className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
                    {isPresentationMode ? copy.exitFullscreen : copy.enterFullscreen}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <div
              className={`relative overflow-hidden ${
                isPresentationMode ? "h-full" : "h-[calc(100%-53px)]"
              }`}
            >
              <div
                className={`absolute z-20 w-[160px] ${isPresentationMode ? "right-3 top-3" : "right-2 top-2"}`}
              >
                {isPresentationMode ? (
                  <div className="mb-2 flex justify-end">
                    <Button
                      className="border border-border/90 bg-background/95 shadow-md backdrop-blur"
                      onClick={() => setIsPresentationMode(false)}
                      size="xs"
                      type="button"
                      variant="outline"
                    >
                      <Minimize className="h-3.5 w-3.5" />
                      {copy.exitFullscreen}
                    </Button>
                  </div>
                ) : null}

                {tocCollapsed ? (
                  <div className="flex justify-end">
                    <Card className="overflow-hidden border-border/90 bg-background/95 shadow-lg backdrop-blur">
                      <div className="flex h-7 items-center px-1">
                        <Button
                          className="h-5 min-w-[48px] justify-center gap-1 px-2 text-[10px] leading-none [&_span]:leading-none"
                          onClick={() => setTocCollapsed(false)}
                          size="xs"
                          type="button"
                          variant="ghost"
                        >
                          <FileText className="h-3 w-3" />
                          <span>{copy.anchors}</span>
                        </Button>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <Card className="w-[160px] overflow-hidden border-border/90 bg-background/95 shadow-lg backdrop-blur">
                    <CardHeader className="flex h-7 flex-row items-center justify-between gap-1.5 px-1.5 py-0">
                      <CardTitle className="flex items-center gap-1 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {copy.anchors}
                      </CardTitle>
                      <Button
                        className="h-5 min-w-[48px] justify-center gap-1 px-2 text-[10px] leading-none [&_span]:leading-none"
                        onClick={() => setTocCollapsed(true)}
                        size="xs"
                        type="button"
                        variant="ghost"
                      >
                        <span>{copy.collapse}</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="fine-scrollbar max-h-[min(52vh,420px)] space-y-0.5 overflow-auto px-1.5 pb-1.5">
                      {prdDocument.toc.map((item) => (
                        <a
                          className={`block rounded-md px-1.5 py-1 text-[10px] leading-4 transition-colors hover:bg-muted ${
                            item.depth === 3
                              ? "pl-3 text-muted-foreground"
                              : "text-foreground"
                          }`}
                          href={`#${item.id}`}
                          key={item.id || `toc-${item.depth}-${item.text}`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div
                ref={previewScrollRef}
                className={`fine-scrollbar h-full overflow-auto ${
                  isPresentationMode ? "px-8 py-8" : "px-4 py-4"
                }`}
                onPointerDown={(event) => {
                  const highlight = event.target instanceof Element
                    ? event.target.closest("[data-prd-comment-highlight]")
                    : null;
                  if (!highlight || !previewContentRef.current?.contains(highlight)) {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();
                  openCommentPopover(highlight);
                }}
                onMouseEnter={() => {
                  activeScrollSourceRef.current = "preview";
                }}
                onMouseUp={handlePreviewMouseUp}
              >
                <article className="prd-preview space-y-4" ref={previewContentRef}>
                  {areCommentsVisible ? (
                    <Card className="border-border/80 bg-muted/10" data-comment-ui>
                      <CardHeader className="border-b bg-background/70 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4" />
                            {copy.commentPanelTitle}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{sortedComments.filter((comment) => comment.status === "open").length} {copy.openStatus}</span>
                            <span>{sortedComments.filter((comment) => comment.status === "resolved").length} {copy.resolvedStatus}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 px-4 py-4">
                        {sortedComments.length === 0 ? (
                          <p className="text-[12px] leading-6 text-muted-foreground">{copy.noComments}</p>
                        ) : (
                          sortedComments.map((comment) => (
                            <article
                              className="rounded-xl border border-border/80 bg-background px-3 py-3 shadow-sm"
                              data-comment-ui
                              key={comment.id}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  className="flex-1 text-left"
                                  onClick={() => scrollToCommentHighlight(comment.id)}
                                  type="button"
                                >
                                  <p className="text-[12px] font-medium leading-5 text-foreground">
                                    "{comment.quote}"
                                  </p>
                                  <p className="mt-1 text-[12px] leading-6 text-muted-foreground">
                                    {comment.body}
                                  </p>
                                </button>
                                <div className="flex items-center gap-2">
                                  {renderCommentStatusBadge(comment)}
                                  {renderCommentActions(comment)}
                                </div>
                              </div>
                            </article>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  ) : null}

                  <div className={`space-y-2 ${isPresentationMode ? "max-w-5xl" : ""}`}>
                    <Badge className="bg-secondary text-secondary-foreground">{prdDocument.meta.owner}</Badge>
                    <div className="space-y-1">
                      <h2 className={`${isPresentationMode ? "text-[2rem]" : "text-[1.7rem]"} font-semibold tracking-tight`}>
                        {prdDocument.meta.title}
                      </h2>
                      <p
                        className={`${
                          isPresentationMode ? "max-w-4xl text-[14px] leading-6" : "max-w-3xl text-[13px] leading-5.5"
                        } text-muted-foreground`}
                      >
                        {prdDocument.meta.summary}
                      </p>
                    </div>
                  </div>

                  {prdDocument.blocks.map((block, index) =>
                    block.type === "markdown" ? (
                      <section
                        key={`${block.type}-${index}`}
                        className="prd-markdown max-w-none"
                        dangerouslySetInnerHTML={{ __html: block.html }}
                      />
                    ) : (
                      <LiveBlock
                        block={block}
                        copy={copy}
                        demoStyle={stableDemoStyle}
                        key={`${block.type}-${block.id || block.source || "block"}-${index}`}
                      />
                    ),
                  )}
                </article>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {selectionDraft && !isCommentComposerOpen ? (
        <div
          className="fixed z-40"
          data-comment-ui
          style={selectionButtonStyle}
        >
          <Button
            className="shadow-xl"
            onClick={openCommentComposer}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            type="button"
            variant="default"
          >
            <Plus className="h-4 w-4" />
            {copy.addComment}
          </Button>
        </div>
      ) : null}

      {hoveredComment && hoveredCommentPopoverStyle ? (
        <div
          className="fixed z-40 w-[320px]"
          data-comment-popover
          data-comment-ui
          ref={commentPopoverRef}
          style={hoveredCommentPopoverStyle}
        >
          <Card className="rounded-xl border border-border/90 bg-background shadow-2xl">
            <CardContent className="space-y-3 px-3.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[12px] font-medium leading-5 text-foreground">
                    "{hoveredComment.quote}"
                  </p>
                  <p className="text-[12px] leading-5.5 text-muted-foreground">
                    {hoveredComment.body}
                  </p>
                </div>
                {renderCommentStatusBadge(hoveredComment)}
              </div>
              <div className="flex items-center justify-end">
                {renderCommentActions(hoveredComment, { compact: true })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isCommentComposerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4" data-comment-ui>
          <Card className="w-full max-w-lg border-border/90 shadow-2xl">
            <CardHeader className="space-y-1 border-b bg-muted/20 px-4 py-3">
              <CardTitle className="text-sm">{copy.addComment}</CardTitle>
              <p className="text-[12px] leading-6 text-muted-foreground">
                "{selectionDraft?.quote}"
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 py-4">
              <textarea
                autoFocus
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-[13px] leading-6 outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder={copy.commentPlaceholder}
                value={commentDraft}
              />
              {commentError ? (
                <p className="text-[12px] leading-5 text-destructive">{commentError}</p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={closeCommentComposer}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {copy.cancel}
                </Button>
                <Button
                  onClick={handleSaveComment}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  {copy.saveComment}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {pendingDeleteComment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4" data-comment-ui>
          <Card className="w-full max-w-md border-border/90 shadow-2xl">
            <CardHeader className="space-y-1 border-b bg-muted/20 px-4 py-3">
              <CardTitle className="text-sm">{copy.commentDeleteTitle}</CardTitle>
              <p className="text-[12px] leading-6 text-muted-foreground">
                {copy.commentDeleteConfirm}
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 py-4">
              <div className="rounded-lg border border-border/80 bg-background px-3 py-3">
                <p className="text-[12px] font-medium leading-5 text-foreground">
                  "{pendingDeleteComment.quote}"
                </p>
                <p className="mt-1 text-[12px] leading-5.5 text-muted-foreground">
                  {pendingDeleteComment.body}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setPendingDeleteComment(null)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {copy.cancel}
                </Button>
                <Button
                  onClick={confirmDeleteComment}
                  size="sm"
                  type="button"
                  variant="destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {copy.commentDeleteAction}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
