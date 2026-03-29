import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  PackageSearch,
  RefreshCcw,
  ShieldAlert,
  Truck,
} from "lucide-react";

import { Badge } from "../apps/web/src/components/ui/badge.jsx";
import { Button } from "../apps/web/src/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../apps/web/src/components/ui/card.jsx";

const iconGroups = [
  {
    title: "Severity",
    description: "Different icon weights and semantic colors for exception urgency.",
    items: [
      { label: "Critical", icon: ShieldAlert, tone: "text-red-600 bg-red-50 border-red-200" },
      { label: "High", icon: AlertTriangle, tone: "text-amber-600 bg-amber-50 border-amber-200" },
      { label: "Watch", icon: BellRing, tone: "text-sky-600 bg-sky-50 border-sky-200" },
    ],
  },
  {
    title: "Workflow",
    description: "Action-oriented icon affordances used inside queue rows and toolbars.",
    items: [
      { label: "Assign", icon: PackageSearch, tone: "text-slate-700 bg-slate-50 border-slate-200" },
      { label: "Retry", icon: RefreshCcw, tone: "text-indigo-600 bg-indigo-50 border-indigo-200" },
      { label: "Resolved", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    ],
  },
];

export default function InventoryStatusIcons() {
  return (
    <Card className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">Icon component rendering</CardTitle>
        <CardDescription className="text-sm leading-6">
          Use this block to inspect icon scale, stroke weight, semantic color pairing, and compact icon-button rendering inside the PRD preview.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {iconGroups.map((group) => (
          <section className="space-y-3" key={group.title}>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{group.title}</h4>
              <p className="text-sm leading-6 text-[color:var(--prd-muted)]">{group.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    className={`inline-flex items-center gap-2 rounded-[calc(var(--prd-radius)-2px)] border px-3 py-2 text-sm ${item.tone}`}
                    key={item.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <section className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Icon buttons and badges</h4>
            <p className="text-sm leading-6 text-[color:var(--prd-muted)]">
              Compact controls often appear in queue rows, filters, and header actions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Stable
            </Badge>
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">
              <Clock3 className="mr-1 h-3.5 w-3.5" />
              Pending review
            </Badge>
            <Badge className="border-sky-200 bg-sky-50 text-sky-700">
              <Truck className="mr-1 h-3.5 w-3.5" />
              Waiting on inbound
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="icon" variant="outline">
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline">
              <PackageSearch className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <BellRing className="h-4 w-4" />
              Notify owner
            </Button>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
