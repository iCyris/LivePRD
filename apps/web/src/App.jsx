import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Expand,
  FileCode2,
  FileText,
  Minimize,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import prdCatalogFallback, { defaultPrdSlug as defaultPrdSlugFallback } from "./generated/prd-data.mjs";
import { ModeToggle } from "./components/ModeToggle.jsx";
import { Badge } from "./components/ui/badge.jsx";
import { Button } from "./components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card.jsx";
import { LiveBlock } from "./components/LiveBlock.jsx";
import { getDemoSourceCode } from "./demo-registry.js";
import {
  archiveVersionFile,
  deleteVersionFile,
  fetchPrdCatalog,
  fetchVersionState,
  saveVersionFile,
} from "./lib/file-authoring.js";
import { demoThemeVars, parseRuntimeDocument } from "./lib/prd-runtime.js";
import { exportDemoBundle, exportMarkdownFile, exportShareHtml } from "./lib/share-export.js";
import { useThemePreference } from "./lib/theme.js";
import {
  hydrateVersionState,
  restoreSelectedVersion,
  selectVersion,
  updateWorkingMarkdown,
} from "./lib/version-store.js";

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

export default function App() {
  const [colorMode, setColorMode] = useThemePreference();
  const [prdCatalog, setPrdCatalog] = useState(prdCatalogFallback);
  const [activeSlug, setActiveSlug] = useState(readDocSlugFromUrl());
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const sourceDocument = useMemo(
    () => documentFromSlug(activeSlug, prdCatalog),
    [activeSlug, prdCatalog],
  );
  const textareaRef = useRef(null);
  const previewScrollRef = useRef(null);
  const previewContentRef = useRef(null);
  const syncingScrollRef = useRef(false);
  const activeScrollSourceRef = useRef("editor");
  const syncFrameRef = useRef(null);
  const noticeTimeoutRef = useRef(null);
  const [versionState, setVersionState] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [versionNameDraft, setVersionNameDraft] = useState("");

  const selectedVersion = useMemo(
    () =>
      versionState?.versions.find((version) => version.id === versionState.selectedVersionId) ??
      versionState?.versions[0] ??
      null,
    [versionState],
  );
  const deferredMarkdown = useDeferredValue(
    versionState?.workingMarkdown ?? sourceDocument?.markdown ?? "",
  );
  const prdDocument = useMemo(
    () =>
      sourceDocument
        ? parseRuntimeDocument(
            deferredMarkdown || sourceDocument.markdown,
            sourceDocument,
          )
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
  const isDirty = Boolean(
    selectedVersion &&
      versionState?.workingMarkdown &&
      versionState.workingMarkdown !== selectedVersion.markdown,
  );

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
          setPrdCatalog(nextCatalog);
        }
      } catch {
        if (!cancelled) {
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
    if (!sourceDocument) {
      return undefined;
    }

    writeDocSlugToUrl(sourceDocument.slug);

    let cancelled = false;
    const refreshState = async () => {
      try {
        const serverState = await fetchVersionState(sourceDocument.slug);
        if (cancelled) {
          return;
        }

        setVersionState((current) =>
          hydrateVersionState(serverState, current, {
            selectedVersionId: current?.selectedVersionId,
          }),
        );
      } catch {
        if (!cancelled) {
          setVersionState((current) => current);
        }
      }
    };

    refreshState();
    const intervalId = window.setInterval(refreshState, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
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
    if (!actionNotice) {
      return undefined;
    }

    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }

    noticeTimeoutRef.current = window.setTimeout(() => {
      setActionNotice(null);
      noticeTimeoutRef.current = null;
    }, 1800);

    return () => {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
        noticeTimeoutRef.current = null;
      }
    };
  }, [actionNotice]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const previewScroll = previewScrollRef.current;

    if (!textarea || !previewScroll) {
      return undefined;
    }

    const syncBySource = (source) => {
      if (syncingScrollRef.current || activeScrollSourceRef.current !== source) {
        return;
      }

      const textareaScrollableHeight = textarea.scrollHeight - textarea.clientHeight;
      const previewScrollableHeight =
        previewScroll.scrollHeight - previewScroll.clientHeight;

      if (textareaScrollableHeight <= 0 || previewScrollableHeight <= 0) {
        if (source === "editor") {
          previewScroll.scrollTop = 0;
        } else {
          textarea.scrollTop = 0;
        }
        return;
      }

      const ratio =
        source === "editor"
          ? textarea.scrollTop / textareaScrollableHeight
          : previewScroll.scrollTop / previewScrollableHeight;

      syncingScrollRef.current = true;
      if (source === "editor") {
        previewScroll.scrollTop = ratio * previewScrollableHeight;
      } else {
        textarea.scrollTop = ratio * textareaScrollableHeight;
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

    const syncPreviewScroll = () => scheduleSync("editor");
    const syncEditorScroll = () => scheduleSync("preview");

    textarea.addEventListener("scroll", syncPreviewScroll, { passive: true });
    previewScroll.addEventListener("scroll", syncEditorScroll, { passive: true });
    scheduleSync("editor");

    return () => {
      if (syncFrameRef.current) {
        window.cancelAnimationFrame(syncFrameRef.current);
      }
      textarea.removeEventListener("scroll", syncPreviewScroll);
      previewScroll.removeEventListener("scroll", syncEditorScroll);
    };
  }, [prdDocument?.markdown, versionState?.workingMarkdown]);

  if (!prdDocument || !sourceDocument || !versionState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        No PRD documents were generated yet. Run `npm run render`.
      </main>
    );
  }

  const visibleVersions = versionState.versions;
  const selectedVersionLabel = selectedVersion?.label ?? "Current";
  const selectedVersionArchived = Boolean(selectedVersion?.archived);

  const pushNotice = (type, message) => {
    setActionNotice({
      id: Date.now(),
      type,
      message,
    });
  };

  const openSaveDialog = () => {
    if (!sourceDocument || !versionState) {
      pushNotice("error", "当前文档还没准备好");
      return;
    }

    const isExistingVersion = selectedVersion?.kind === "version";
    const suggestedName = isExistingVersion
      ? selectedVersion.label
      : `${sourceDocument.meta.title} ${new Date().toLocaleString("zh-CN", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}`;
    setVersionNameDraft(suggestedName);
    setSaveDialogOpen(true);
  };

  const handleSaveVersion = async () => {
    const cleanName = versionNameDraft.trim();
    if (!cleanName) {
      pushNotice("error", "版本名称不能为空");
      return;
    }

    try {
      const shouldOverwrite =
        isExistingVersion && cleanName === selectedVersion.label;
      const serverState = await saveVersionFile(sourceDocument.slug, {
        versionId: shouldOverwrite ? selectedVersion.id : null,
        label: cleanName,
        markdown: versionState.workingMarkdown,
      });

      const nextSelectedVersionId =
        serverState.versions.find(
          (version) =>
            version.kind === "version" &&
            version.label === cleanName &&
            version.markdown === versionState.workingMarkdown,
        )?.id ??
        serverState.versions.find((version) => version.kind === "version" && version.label === cleanName)?.id ??
        selectedVersion?.id;

      setVersionState((current) =>
        hydrateVersionState(serverState, current, {
          forceWorkingMarkdown: true,
          selectedVersionId: nextSelectedVersionId,
        }),
      );
      setSaveDialogOpen(false);
      pushNotice("success", shouldOverwrite ? `已保存 ${cleanName}` : `已新建版本 ${cleanName}`);
    } catch (error) {
      pushNotice("error", error instanceof Error ? error.message : "保存失败");
    }
  };

  const handleRestoreVersion = () => {
    if (!selectedVersion) {
      pushNotice("error", "没有可恢复的版本");
      return;
    }

    setVersionState((current) => restoreSelectedVersion(current));
    pushNotice("success", `已恢复到 ${selectedVersion.label}`);
  };

  const handleArchiveVersion = async () => {
    if (!selectedVersion) {
      pushNotice("error", "没有可归档的版本");
      return;
    }

    if (selectedVersion.kind === "source") {
      pushNotice("error", "导入源版本不能归档");
      return;
    }

    try {
      const serverState = await archiveVersionFile(sourceDocument.slug, selectedVersion.id);
      const fallbackVersionId =
        serverState.versions.find((version) => version.kind === "version" && !version.archived)?.id ??
        serverState.versions[0]?.id;
      setVersionState((current) =>
        hydrateVersionState(serverState, current, {
          forceWorkingMarkdown: true,
          selectedVersionId: fallbackVersionId,
        }),
      );
      pushNotice("success", `已归档 ${selectedVersion.label}`);
    } catch (error) {
      pushNotice("error", error instanceof Error ? error.message : "归档失败");
    }
  };

  const handleDeleteVersion = async () => {
    if (!selectedVersion) {
      pushNotice("error", "没有可删除的版本");
      return;
    }

    if (selectedVersion.kind === "source") {
      pushNotice("error", "导入源版本不能删除");
      return;
    }

    try {
      const serverState = await deleteVersionFile(sourceDocument.slug, selectedVersion.id);
      setVersionState((current) =>
        hydrateVersionState(serverState, current, {
          forceWorkingMarkdown: true,
        }),
      );
      pushNotice("success", `已删除 ${selectedVersion.label}`);
    } catch (error) {
      pushNotice("error", error instanceof Error ? error.message : "删除失败");
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header
        className={`z-30 shrink-0 border-b bg-background/94 backdrop-blur supports-[backdrop-filter]:bg-background/78 ${
          isPresentationMode ? "hidden" : ""
        }`}
      >
        <div className="mx-auto flex max-w-[1680px] flex-col gap-1.5 px-3 py-1.5 xl:px-4">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <Badge className="bg-secondary text-secondary-foreground">Live PRD</Badge>
              <h1 className="truncate text-[13px] font-semibold tracking-tight">{prdDocument.meta.title}</h1>
              <Badge className="border-dashed bg-background text-muted-foreground">{prdDocument.meta.status}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
              <label className="flex items-center gap-1.5 text-[10px] leading-none">
                <span className="text-muted-foreground">文档</span>
                <span className="relative inline-flex items-center">
                  <select
                    className="h-7 min-w-[180px] appearance-none rounded-md border bg-background pl-2 pr-8 text-[11px] shadow-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
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

              <label className="flex items-center gap-1.5 text-[10px] leading-none">
                <span className="text-muted-foreground">版本</span>
                <span className="relative inline-flex items-center">
                  <select
                    className="h-7 min-w-[196px] appearance-none rounded-md border bg-background pl-2 pr-8 text-[11px] shadow-sm outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
                    onChange={(event) => {
                      const nextVersionId = event.target.value;
                      setVersionState((current) => selectVersion(current, nextVersionId));
                    }}
                    value={selectedVersion?.id ?? ""}
                  >
                    {visibleVersions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.label}
                        {version.archived ? " · archived" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </span>
              </label>

              <div className="flex items-center gap-1.5">
                <Button
                  onClick={handleRestoreVersion}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  恢复
                </Button>

                <Button
                  onClick={handleArchiveVersion}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Archive className="h-4 w-4" />
                  归档
                </Button>

                <Button
                  onClick={handleDeleteVersion}
                  size="sm"
                  type="button"
                  variant="danger"
                >
                  <Trash2 className="h-4 w-4" />
                  删除
                </Button>
              </div>

              <div className="flex h-7 items-center gap-1 px-1 text-[10px] text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>{prdDocument.theme.label}</span>
                {selectedVersionArchived ? <span>· 已归档</span> : null}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                onClick={() =>
                  exportMarkdownFile({
                    document: prdDocument,
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Markdown
              </Button>

              <Button
                onClick={() =>
                  exportDemoBundle({
                    document: prdDocument,
                    demos: referencedDemos,
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                Demo 包
              </Button>

              <Button
                onClick={() =>
                  exportShareHtml({
                    document: prdDocument,
                    element: previewContentRef.current,
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <Download className="h-4 w-4" />
                HTML
              </Button>

              <ModeToggle onChange={setColorMode} value={colorMode} />
            </div>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto grid min-h-0 w-full flex-1 overflow-hidden ${
          isPresentationMode
            ? "max-w-none grid-cols-[minmax(0,1fr)] px-0 py-0"
            : "max-w-[1680px] gap-2.5 px-3 py-2.5 xl:grid-cols-[minmax(320px,0.64fr)_minmax(0,1.56fr)] xl:px-4"
        }`}
      >
        <Card
          className={`min-h-0 overflow-hidden border-border/80 shadow-[0_1px_2px_rgba(0,0,0,0.025)] ${
            isPresentationMode ? "hidden" : ""
          }`}
        >
          <CardHeader className="border-b bg-muted/15 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileCode2 className="h-4 w-4" />
                Markdown Editor
              </CardTitle>
              <div className="flex items-center gap-1.5">
                {isDirty ? <Badge className="bg-accent text-accent-foreground">草稿已改</Badge> : null}
                <Button
                  onClick={openSaveDialog}
                  size="xs"
                  type="button"
                  variant="default"
                >
                  <Save className="h-3.5 w-3.5" />
                  保存
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[calc(100%-53px)] p-0">
            <textarea
              ref={textareaRef}
              className="fine-scrollbar h-full w-full resize-none border-0 bg-background px-3 py-2.5 font-mono text-[11px] leading-5 outline-none"
              onFocus={() => {
                activeScrollSourceRef.current = "editor";
              }}
              onMouseEnter={() => {
                activeScrollSourceRef.current = "editor";
              }}
              onChange={(event) =>
                setVersionState((current) =>
                  updateWorkingMarkdown(current, event.target.value),
                )
              }
              value={versionState.workingMarkdown}
            />
          </CardContent>
        </Card>

        <section className="grid min-h-0 gap-4">
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
                <div className="space-y-0">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4" />
                    Rendered HTML
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className="bg-secondary text-secondary-foreground">
                    {selectedVersion?.label}
                  </Badge>
                  <Button
                    onClick={() => setIsPresentationMode((value) => !value)}
                    size="xs"
                    type="button"
                    variant="ghost"
                  >
                    {isPresentationMode ? <Minimize className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
                    {isPresentationMode ? "退出全屏" : "全屏"}
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
                className={`absolute z-20 w-[196px] ${isPresentationMode ? "right-4 top-4" : "right-2.5 top-2.5"}`}
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
                      退出全屏
                    </Button>
                  </div>
                ) : null}
                {tocCollapsed ? (
                  <div className="flex justify-end">
                    <Card className="overflow-hidden border-border/90 bg-background/95 shadow-lg backdrop-blur">
                      <div className="flex h-8 items-center px-1">
                        <Button
                          className="h-6 min-w-[58px] justify-center gap-1.5 px-2.5 text-[10px] leading-none [&_span]:leading-none"
                          onClick={() => setTocCollapsed(false)}
                          size="xs"
                          type="button"
                          variant="ghost"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>目录</span>
                        </Button>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <Card className="w-[196px] overflow-hidden border-border/90 bg-background/95 shadow-lg backdrop-blur">
                    <CardHeader className="flex h-8 flex-row items-center justify-between gap-2 px-2 py-0">
                      <CardTitle className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Anchors
                      </CardTitle>
                      <Button
                        className="h-6 min-w-[58px] justify-center gap-1.5 px-2.5 text-[10px] leading-none [&_span]:leading-none"
                        onClick={() => setTocCollapsed(true)}
                        size="xs"
                        type="button"
                        variant="ghost"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span>收起</span>
                      </Button>
                    </CardHeader>
                    <CardContent className="fine-scrollbar max-h-[min(60vh,520px)] space-y-1 overflow-auto px-2 pb-2">
                      {prdDocument.toc.map((item) => (
                        <a
                          className={`block rounded-md px-2 py-1.5 leading-4.5 transition-colors hover:bg-muted ${
                            item.depth === 3
                              ? "pl-3.5 text-[11px] text-muted-foreground"
                              : "text-[11px] text-foreground"
                          }`}
                          href={`#${item.id}`}
                          key={item.id}
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
                  isPresentationMode ? "px-10 py-10" : "px-4 py-4"
                }`}
                onMouseEnter={() => {
                  activeScrollSourceRef.current = "preview";
                }}
              >
                <article className="space-y-4" ref={previewContentRef}>
                <div className={`space-y-2 ${isPresentationMode ? "max-w-5xl" : ""}`}>
                  <Badge className="bg-secondary text-secondary-foreground">{prdDocument.meta.owner}</Badge>
                  <div className="space-y-1">
                    <h2 className={`${isPresentationMode ? "text-[2rem]" : "text-[1.7rem]"} font-semibold tracking-tight`}>
                      {prdDocument.meta.title}
                    </h2>
                    <p className={`${isPresentationMode ? "max-w-4xl text-[14px] leading-6" : "max-w-3xl text-[13px] leading-5.5"} text-muted-foreground`}>
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
                      demoStyle={stableDemoStyle}
                      key={`${block.type}-${block.id || index}`}
                    />
                  ),
                )}
                </article>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {actionNotice ? (
        <div className="pointer-events-none fixed left-1/2 top-4 z-50 -translate-x-1/2">
          <div
            className={`inline-flex min-h-10 items-center rounded-md border px-4 py-2 text-[12px] font-medium shadow-xl backdrop-blur ${
              actionNotice.type === "error"
                ? "border-destructive/35 bg-background/98 text-foreground"
                : "border-border/90 bg-background/98 text-foreground"
            }`}
          >
            {actionNotice.message}
          </div>
        </div>
      ) : null}

      {saveDialogOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/55 px-4 backdrop-blur-[2px]">
          <Card className="w-full max-w-md border-border/90 shadow-2xl">
            <CardHeader className="space-y-1 border-b bg-muted/20 px-4 py-3">
              <CardTitle className="text-sm">保存版本</CardTitle>
              <p className="text-[11px] leading-5 text-muted-foreground">
                输入版本名称。若名称与当前版本相同，则覆盖当前版本文件；否则创建一个新的版本 Markdown 文件。
              </p>
            </CardHeader>
            <CardContent className="space-y-3 px-4 py-4">
              <label className="grid gap-1.5 text-[11px] text-muted-foreground">
                <span>版本名称</span>
                <input
                  autoFocus
                  className="h-9 rounded-md border bg-background px-3 text-[12px] text-foreground outline-none ring-offset-background focus-visible:ring-1 focus-visible:ring-ring"
                  onChange={(event) => setVersionNameDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSaveVersion();
                    }
                  }}
                  value={versionNameDraft}
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setSaveDialogOpen(false)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  取消
                </Button>
                <Button
                  onClick={handleSaveVersion}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  保存到版本文件
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
