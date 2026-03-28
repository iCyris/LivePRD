import { ArrowRight } from "lucide-react";

import { Badge } from "../apps/web/src/components/ui/badge.jsx";

export default function InventoryAlertPage() {
  return (
    <main className="min-h-full bg-[color:var(--prd-surface)] p-8 text-[color:var(--prd-text)]">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <Badge className="bg-[color:color-mix(in_srgb,var(--prd-primary)_10%,white)] text-[color:var(--prd-primary)]">
            Live page
          </Badge>
          <h1 className="text-5xl leading-tight">Replace this headline with the page intent</h1>
          <p className="max-w-2xl text-lg leading-8 text-[color:var(--prd-muted)]">
            Describe the user story this page exists to validate.
          </p>
        </section>
        <section className="rounded-[var(--prd-radius)] border border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] p-6 shadow-[var(--prd-shadow)]">
          <div className="flex items-center gap-2 text-[color:var(--prd-primary)]">
            <ArrowRight className="h-4 w-4" />
            <span className="text-sm font-medium">Replace this panel with the critical interaction</span>
          </div>
        </section>
      </div>
    </main>
  );
}
