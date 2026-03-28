import { ArrowRight, CheckCircle2, TimerReset } from "lucide-react";

import { Badge } from "../apps/web/src/components/ui/badge.jsx";
import { Button } from "../apps/web/src/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../apps/web/src/components/ui/card.jsx";
import RetryCard from "./retry-card.jsx";

export default function CheckoutRecoveryPage() {
  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(216,147,87,0.22),transparent_28%),linear-gradient(180deg,var(--prd-surface)_0%,#fffdf9_100%)] px-6 py-10 text-[color:var(--prd-text)]">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <Badge className="bg-[color:color-mix(in_srgb,var(--prd-primary)_10%,white)] text-[color:var(--prd-primary)]">
            Recovery journey
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl leading-tight">
              Recover gracefully after checkout timeout without forcing a reset
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[color:var(--prd-muted)]">
              The live PRD page shows tone, preserved-state messaging, and the exact retry call to action in one place so product, design, and engineering can align faster.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">State safety</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[color:var(--prd-muted)]">
                Preserve cart, address, and merchandising context while clearly noting that payment was not captured.
              </CardContent>
            </Card>
            <Card className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Copy tone</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[color:var(--prd-muted)]">
                Use calming language that explains the timeout and gives the user a clear next step.
              </CardContent>
            </Card>
            <Card className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Retry path</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[color:var(--prd-muted)]">
                Keep the user close to completion with a primary retry CTA and a secondary safe exit.
              </CardContent>
            </Card>
          </div>
          <Card className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)]">
            <CardHeader>
              <CardTitle className="text-xl">Expected flow</CardTitle>
              <CardDescription>What engineering should preserve through the failure and retry sequence.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[calc(var(--prd-radius)-8px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
                <TimerReset className="mb-3 h-5 w-5 text-[color:var(--prd-primary)]" />
                <p className="text-sm font-medium">Timeout detected</p>
                <p className="mt-2 text-sm text-[color:var(--prd-muted)]">Do not redirect. Keep checkout mounted and freeze sensitive actions.</p>
              </div>
              <div className="rounded-[calc(var(--prd-radius)-8px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
                <CheckCircle2 className="mb-3 h-5 w-5 text-[color:var(--prd-primary)]" />
                <p className="text-sm font-medium">Explain preserved state</p>
                <p className="mt-2 text-sm text-[color:var(--prd-muted)]">Show cart and shipping are safe, and that payment did not complete.</p>
              </div>
              <div className="rounded-[calc(var(--prd-radius)-8px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
                <ArrowRight className="mb-3 h-5 w-5 text-[color:var(--prd-primary)]" />
                <p className="text-sm font-medium">Offer retry</p>
                <p className="mt-2 text-sm text-[color:var(--prd-muted)]">Enable fast retry plus a safe fallback for users who need more time.</p>
              </div>
            </CardContent>
          </Card>
        </section>
        <aside className="lg:pt-20">
          <RetryCard />
        </aside>
      </div>
    </main>
  );
}
