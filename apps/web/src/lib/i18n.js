import { useEffect, useMemo, useState } from "react";

const storageKey = "live-prd-ui-locale";

const messages = {
  zh: {
    locale: "zh-CN",
    appBadge: "Live PRD",
    docLabel: "文档",
    sourceFile: "文件",
    sourceTitle: "Markdown 源文件",
    sourceHint: "请在本地编辑器或 AI 工具里修改这个文件，预览页会自动刷新并重新渲染 demo。",
    exportMarkdown: "Markdown",
    exportDemoBundle: "Demo 包",
    exportHtml: "HTML",
    shareExport: "分享与导出",
    settings: "设置",
    appearance: "主题",
    renderTitle: "渲染预览",
    expandMarkdown: "展开 Markdown",
    collapseMarkdown: "收起 Markdown",
    enterFullscreen: "全屏",
    exitFullscreen: "退出全屏",
    comments: "评论",
    commentsHidden: "隐藏评论",
    addComment: "添加评论",
    commentPlaceholder: "写下你的批注或待确认问题。",
    commentSelectionHint: "先在右侧预览里选中一段文字，再添加评论。",
    commentBodyRequired: "请先输入评论内容。",
    commentPanelTitle: "评论与批注",
    noComments: "当前还没有评论。",
    resolveComment: "标记已解决",
    reopenComment: "重新打开",
    deleteComment: "删除",
    openStatus: "进行中",
    resolvedStatus: "已解决",
    saveComment: "保存评论",
    cancel: "取消",
    commentSaved: "评论已写入本地 Markdown",
    commentSaveFailed: "评论写入失败",
    commentDeleteFailed: "评论删除失败",
    commentDeleteTitle: "删除已解决评论",
    commentDeleteConfirm: "确认删除这条已解决评论吗？删除后无法恢复。",
    commentDeleteAction: "确认删除",
    sourceHintLabel: "说明",
    anchors: "目录",
    collapse: "收起",
    noPrdDocuments: "当前项目还没有可渲染的 PRD。请先在 `docs/prd/` 下准备 Markdown，并运行 `npm run render`。",
    livePage: "Live 页面",
    liveDemo: "Live Demo",
    loadingDemo: "正在加载 demo",
    demoLoadFailed: "Demo 加载失败",
    demoTimedOut: "Demo 加载超时，请刷新页面后重试。",
    demoFailedDefault: "当前 demo 未成功启动。你可以刷新页面后再试。",
    demoMissing: (source) => `无法解析 demo 模块：${source}`,
    light: "浅色",
    dark: "深色",
    system: "跟随系统",
    language: "语言",
    chinese: "中文",
    english: "English",
  },
  en: {
    locale: "en-US",
    appBadge: "Live PRD",
    docLabel: "Document",
    sourceFile: "File",
    sourceTitle: "Markdown Source",
    sourceHint: "Update this file in your local editor or AI tool. The preview will refresh and re-render demos automatically.",
    exportMarkdown: "Markdown",
    exportDemoBundle: "Demo Bundle",
    exportHtml: "HTML",
    shareExport: "Share & Export",
    settings: "Settings",
    appearance: "Appearance",
    renderTitle: "Rendered Preview",
    expandMarkdown: "Show Markdown",
    collapseMarkdown: "Hide Markdown",
    enterFullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    comments: "Comments",
    commentsHidden: "Hide comments",
    addComment: "Add comment",
    commentPlaceholder: "Write the feedback or open question here.",
    commentSelectionHint: "Select a short text span in the preview first, then add a comment.",
    commentBodyRequired: "Write a comment before saving.",
    commentPanelTitle: "Comments",
    noComments: "No comments yet.",
    resolveComment: "Mark resolved",
    reopenComment: "Reopen",
    deleteComment: "Delete",
    openStatus: "Open",
    resolvedStatus: "Resolved",
    saveComment: "Save comment",
    cancel: "Cancel",
    commentSaved: "Comment saved to the local Markdown",
    commentSaveFailed: "Failed to save the comment",
    commentDeleteFailed: "Failed to delete the comment",
    commentDeleteTitle: "Delete resolved comment",
    commentDeleteConfirm: "Delete this resolved comment? This action cannot be undone.",
    commentDeleteAction: "Delete comment",
    sourceHintLabel: "Info",
    anchors: "Anchors",
    collapse: "Collapse",
    noPrdDocuments: "No renderable PRD was found yet. Add Markdown under `docs/prd/` and run `npm run render`.",
    livePage: "Live page",
    liveDemo: "Live demo",
    loadingDemo: "Loading demo",
    demoLoadFailed: "Demo failed to load",
    demoTimedOut: "Demo load timed out. Try refreshing this page.",
    demoFailedDefault: "The current demo did not start correctly. Try refreshing the page.",
    demoMissing: (source) => `Could not resolve demo module for ${source}`,
    light: "Light",
    dark: "Dark",
    system: "System",
    language: "Language",
    chinese: "Chinese",
    english: "English",
  },
};

function resolveInitialLocale() {
  if (typeof window === "undefined") {
    return "zh";
  }

  const stored = window.localStorage.getItem(storageKey);
  if (stored === "zh" || stored === "en") {
    return stored;
  }

  const browserLocale = window.navigator.language.toLowerCase();
  return browserLocale.startsWith("zh") ? "zh" : "en";
}

export const localeOptions = [
  { value: "zh", labelKey: "chinese" },
  { value: "en", labelKey: "english" },
];

export function useLanguagePreference() {
  const [locale, setLocale] = useState(resolveInitialLocale);
  const copy = useMemo(() => messages[locale] || messages.zh, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, locale);
    document.documentElement.lang = copy.locale;
  }, [copy.locale, locale]);

  return [locale, setLocale, copy];
}
