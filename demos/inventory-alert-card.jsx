import { Sparkles } from "lucide-react";

import { Button } from "../apps/web/src/components/ui/button.jsx";

export default function InventoryAlertCard() {
  return (
    <section className="max-w-xl rounded-[var(--prd-radius)] border border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] p-6 shadow-[var(--prd-shadow)]">
      <div className="flex items-center gap-2 text-[color:var(--prd-primary)]">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Interactive proof point</span>
      </div>
      <h3 className="mt-4 text-2xl leading-tight text-[color:var(--prd-text)]">
        Replace this component stub with the state you want engineering to align on
      </h3>
      <p className="mt-3 text-sm leading-6 text-[color:var(--prd-muted)]">
        Keep the interaction focused on one requirement question.
      </p>
      <div className="mt-5">
        <Button>Primary action</Button>
      </div>
    </section>
  );
}
