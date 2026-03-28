import { AlertTriangle, MonitorSmartphone, Puzzle } from "lucide-react";

import { resolveDemo } from "../demo-registry.js";
import { Badge } from "./ui/badge.jsx";

export function LiveBlock({ block }) {
  const ResolvedComponent = resolveDemo(block.source);
  const isPage = block.type === "live-page";

  return (
    <section className="overflow-hidden rounded-[28px] border border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--prd-border)] bg-[color:color-mix(in_srgb,var(--prd-surface)_65%,white)] px-5 py-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-[color:color-mix(in_srgb,var(--prd-primary)_10%,white)] text-[color:var(--prd-primary)]">
              {isPage ? "Live page" : "Live demo"}
            </Badge>
            <span className="text-sm text-[color:var(--prd-muted)]">{block.id}</span>
          </div>
          {block.caption ? (
            <p className="text-sm leading-6 text-[color:var(--prd-muted)]">{block.caption}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-[color:var(--prd-muted)]">
          {isPage ? <MonitorSmartphone className="h-4 w-4" /> : <Puzzle className="h-4 w-4" />}
          <span>{block.source}</span>
        </div>
      </header>

      <div
        className={`overflow-auto bg-[color:var(--prd-surface)] ${
          isPage ? "p-0" : "p-6"
        }`}
        style={{ minHeight: `${block.height}px` }}
      >
        {ResolvedComponent ? (
          <ResolvedComponent />
        ) : (
          <div className="flex min-h-[240px] items-center gap-3 rounded-[24px] border border-dashed border-[color:var(--prd-border)] bg-white/70 p-6 text-sm text-[color:var(--prd-muted)]">
            <AlertTriangle className="h-5 w-5 text-[color:var(--prd-primary)]" />
            Could not resolve demo module for <code>{block.source}</code>.
          </div>
        )}
      </div>
    </section>
  );
}
