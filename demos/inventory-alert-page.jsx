import { AlertTriangle, ChartColumnIncreasing, Clock3, ShieldAlert } from "lucide-react";

import { Badge } from "../apps/web/src/components/ui/badge.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../apps/web/src/components/ui/card.jsx";
import InventoryExceptionQueue from "./inventory-exception-queue.jsx";

const stats = [
  {
    label: "Critical open",
    value: "12",
    detail: "4 cases breached SLA in the last hour",
    icon: ShieldAlert,
  },
  {
    label: "Median first action",
    value: "14m",
    detail: "Down 18m week over week",
    icon: Clock3,
  },
  {
    label: "Recovered GMV at risk",
    value: "$82k",
    detail: "Projected save if top queue resolves today",
    icon: ChartColumnIncreasing,
  },
];

export default function InventoryAlertPage() {
  return (
    <main className="min-h-full bg-[linear-gradient(180deg,var(--prd-surface)_0%,white_100%)] px-8 py-8 text-[color:var(--prd-text)]">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-4">
            <Badge className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] text-[color:var(--prd-text)]">
              Operations console
            </Badge>
            <div className="space-y-3">
              <h1 className="max-w-4xl text-[40px] leading-tight tracking-tight">
                Give operations one live surface to triage inventory exceptions before they become customer-facing failures
              </h1>
              <p className="max-w-3xl text-[15px] leading-7 text-[color:var(--prd-muted)]">
                This page demo combines summary metrics, queue management, and inline action capture so product, design, and engineering can align on the exact operational workflow.
              </p>
            </div>
          </div>

          <Card className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="h-5 w-5" />
                Why this matters
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                The current exception handling flow spreads context across dashboards, chat, and spreadsheets. This prototype tests whether one console can shorten handoff time and improve action quality.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-[color:var(--prd-muted)]">
              <p>Operators need to understand urgency quickly, see the recommended action, and record the next step without opening a second tool.</p>
              <p>Managers need a view that makes blocked work and ownership gaps visible at a glance.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]"
                key={stat.label}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription className="text-[12px] uppercase tracking-[0.08em]">
                      {stat.label}
                    </CardDescription>
                    <Icon className="h-4 w-4 text-[color:var(--prd-muted)]" />
                  </div>
                  <CardTitle className="text-[30px] leading-none tracking-tight">{stat.value}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-[color:var(--prd-muted)]">
                  {stat.detail}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <InventoryExceptionQueue />
      </div>
    </main>
  );
}
