import { useEffect, useMemo, useState } from "react";
import { FileText, LayoutTemplate, Sparkles } from "lucide-react";

import prdCatalog, { defaultPrdSlug } from "./generated/prd-data.mjs";
import { Badge } from "./components/ui/badge.jsx";
import { LiveBlock } from "./components/LiveBlock.jsx";

function themeVars(tokens) {
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

function documentFromSlug(slug) {
  return prdCatalog.find((item) => item.slug === slug) ?? prdCatalog[0] ?? null;
}

function readDocSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("doc") || defaultPrdSlug;
}

function writeDocSlugToUrl(slug) {
  const url = new URL(window.location.href);
  url.searchParams.set("doc", slug);
  window.history.replaceState({}, "", url);
}

export default function App() {
  const initialSlug = readDocSlugFromUrl();
  const [activeSlug, setActiveSlug] = useState(initialSlug);
  const document = useMemo(() => documentFromSlug(activeSlug), [activeSlug]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveSlug(readDocSlugFromUrl());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (document) {
      writeDocSlugToUrl(document.slug);
    }
  }, [document]);

  if (!document) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-800">
        No PRD documents were generated yet. Run `npm run render`.
      </main>
    );
  }

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,var(--prd-surface)_0%,#fff_100%)] text-[color:var(--prd-text)]"
      style={themeVars(document.theme.tokens)}
    >
      <div className="mx-auto grid min-h-screen max-w-[1500px] gap-8 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[28px] border border-[color:var(--prd-border)] bg-[color:color-mix(in_srgb,var(--prd-panel)_94%,white)] p-5 shadow-[var(--prd-shadow)]">
          <div className="space-y-4">
            <Badge className="bg-[color:color-mix(in_srgb,var(--prd-primary)_12%,white)] text-[color:var(--prd-primary)]">
              Live PRD Studio
            </Badge>
            <div className="space-y-2">
              <h1 className="text-2xl">PRD library</h1>
              <p className="text-sm leading-6 text-[color:var(--prd-muted)]">
                Markdown remains the source of truth. Interactive React demos render beside the written requirement.
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-3">
            {prdCatalog.map((item) => {
              const isActive = item.slug === document.slug;
              return (
                <button
                  key={item.slug}
                  className={`w-full rounded-[20px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[color:var(--prd-primary)] bg-[color:color-mix(in_srgb,var(--prd-primary)_8%,white)]"
                      : "border-[color:var(--prd-border)] bg-white/70 hover:bg-white"
                  }`}
                  onClick={() => setActiveSlug(item.slug)}
                  type="button"
                >
                  <div className="flex items-center gap-2 text-sm text-[color:var(--prd-primary)]">
                    <FileText className="h-4 w-4" />
                    <span>{item.meta.status}</span>
                  </div>
                  <div className="mt-3 text-base font-medium">{item.meta.title}</div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--prd-muted)]">
                    {item.meta.summary}
                  </p>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[24px] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
            <div className="flex items-center gap-2 text-sm text-[color:var(--prd-primary)]">
              <LayoutTemplate className="h-4 w-4" />
              Theme
            </div>
            <p className="mt-2 text-sm text-[color:var(--prd-muted)]">{document.theme.label}</p>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]">
            <div className="grid gap-6 border-b border-[color:var(--prd-border)] bg-[radial-gradient(circle_at_top_left,rgba(216,147,87,0.22),transparent_30%),linear-gradient(140deg,color-mix(in_srgb,var(--prd-surface)_70%,white),white)] px-7 py-8 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-4">
                <Badge className="bg-white/80 text-[color:var(--prd-primary)]">
                  {document.meta.owner}
                </Badge>
                <div className="space-y-3">
                  <h2 className="max-w-4xl text-5xl leading-tight">{document.meta.title}</h2>
                  <p className="max-w-3xl text-lg leading-8 text-[color:var(--prd-muted)]">
                    {document.meta.summary}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 self-end">
                <div className="rounded-[24px] border border-[color:var(--prd-border)] bg-white/70 p-4">
                  <div className="flex items-center gap-2 text-sm text-[color:var(--prd-primary)]">
                    <Sparkles className="h-4 w-4" />
                    Living artifact
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--prd-muted)]">
                    The written PRD and live demo stay in one artifact, so review comments map directly to interactive states.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-8 px-7 py-7 xl:grid-cols-[minmax(0,1fr)_240px]">
              <article className="space-y-6">
                {document.blocks.map((block, index) =>
                  block.type === "markdown" ? (
                  <section
                      key={`${block.type}-${index}`}
                      className="prd-markdown max-w-none"
                      dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                  ) : (
                    <LiveBlock key={`${block.type}-${block.id || index}`} block={block} />
                  ),
                )}
              </article>

              <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                <div className="rounded-[24px] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
                  <p className="text-sm font-medium text-[color:var(--prd-primary)]">On this page</p>
                  <nav className="mt-4 space-y-3">
                    {document.toc.map((item) => (
                      <a
                        key={item.id}
                        className={`block text-sm leading-6 ${
                          item.depth === 3 ? "pl-4 text-[color:var(--prd-muted)]" : ""
                        }`}
                        href={`#${item.id}`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
