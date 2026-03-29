import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CircleCheck,
  Clock3,
  PencilLine,
  Search,
  UserRoundPlus,
  X,
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

const initialItems = [
  {
    id: "INV-2198",
    title: "Promo stock dropped below safety threshold",
    sku: "SKU-44821",
    market: "US",
    severity: "critical",
    status: "needs_action",
    owner: "Unassigned",
    freshness: "9 min",
    recommendation: "Pause campaign and verify stock delta before noon traffic peak.",
    note: "Marketing campaign increased sell-through faster than expected.",
  },
  {
    id: "INV-2174",
    title: "Bundle availability mismatch across channels",
    sku: "SKU-12077",
    market: "EU",
    severity: "high",
    status: "in_progress",
    owner: "Mia Chen",
    freshness: "32 min",
    recommendation: "Confirm bundle children stock and recalc storefront cache.",
    note: "ERP bundle stock and web cache diverged after scheduled feed.",
  },
  {
    id: "INV-2141",
    title: "Warehouse receipt delayed for launch SKU",
    sku: "SKU-88510",
    market: "APAC",
    severity: "medium",
    status: "needs_verification",
    owner: "Ravi Kumar",
    freshness: "1 h",
    recommendation: "Validate inbound ETA and hold launch promise copy.",
    note: "Inbound scan missing; ETA confidence below target threshold.",
  },
];

const severityTone = {
  critical: "border-red-200 bg-red-50 text-red-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  medium: "border-sky-200 bg-sky-50 text-sky-700",
};

const statusLabel = {
  needs_action: "Needs action",
  in_progress: "In progress",
  needs_verification: "Needs verification",
  resolved: "Resolved",
};

export default function InventoryExceptionQueue() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(initialItems);
  const [activeItemId, setActiveItemId] = useState("");
  const [draft, setDraft] = useState({
    owner: "",
    status: "needs_action",
    dueTime: "",
    note: "",
  });

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((item) =>
      [item.id, item.title, item.sku, item.market, item.owner].some((field) =>
        String(field).toLowerCase().includes(normalized),
      ),
    );
  }, [items, query]);

  const activeItem = items.find((item) => item.id === activeItemId) ?? null;

  const openActionModal = (item) => {
    setActiveItemId(item.id);
    setDraft({
      owner: item.owner === "Unassigned" ? "" : item.owner,
      status: item.status,
      dueTime: item.dueTime || "Today 18:00",
      note: item.note || "",
    });
  };

  const closeActionModal = () => {
    setActiveItemId("");
  };

  const saveChanges = () => {
    setItems((current) =>
      current.map((item) =>
        item.id === activeItemId
          ? {
              ...item,
              owner: draft.owner.trim() || "Unassigned",
              status: draft.status,
              dueTime: draft.dueTime,
              note: draft.note.trim() || item.note,
            }
          : item,
      ),
    );
    closeActionModal();
  };

  return (
    <div className="space-y-5 text-[color:var(--prd-text)]">
      <Card className="border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]">
        <CardHeader className="gap-3 border-b border-[color:var(--prd-border)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Inventory exception queue</CardTitle>
              <CardDescription className="mt-1 text-sm leading-6">
                Review the highest-risk inventory exceptions, assign an owner, and capture the next action without leaving the queue.
              </CardDescription>
            </div>
            <Badge className="border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] text-[color:var(--prd-text)]">
              3 active exceptions
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[260px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--prd-muted)]" />
              <input
                className="h-10 w-full rounded-[calc(var(--prd-radius)-2px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] pl-9 pr-3 text-sm outline-none transition focus:border-[color:var(--prd-primary)]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by exception id, SKU, market, or owner"
                value={query}
              />
            </div>
            <Button size="sm" variant="outline">
              <ArrowUpRight className="h-4 w-4" />
              Export handoff
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-[var(--prd-radius)]">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[color:var(--prd-surface)] text-left text-[11px] uppercase tracking-[0.08em] text-[color:var(--prd-muted)]">
                <tr>
                  <th className="px-4 py-3">Exception</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Freshness</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    className="border-t border-[color:var(--prd-border)] align-top transition hover:bg-[color:var(--prd-surface)]/60"
                    key={item.id}
                  >
                    <td className="px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{item.id}</span>
                          <span className="text-[color:var(--prd-muted)]">{item.sku}</span>
                          <span className="text-[color:var(--prd-muted)]">{item.market}</span>
                        </div>
                        <p className="font-medium">{item.title}</p>
                        <p className="max-w-[34rem] text-[13px] leading-5 text-[color:var(--prd-muted)]">
                          {item.recommendation}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={severityTone[item.severity]}>
                        {item.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-[color:var(--prd-surface)] px-2.5 py-1 text-[12px] font-medium text-[color:var(--prd-text)]">
                        {statusLabel[item.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[color:var(--prd-muted)]">{item.owner}</td>
                    <td className="px-4 py-4 text-[13px] text-[color:var(--prd-muted)]">{item.freshness}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <Button onClick={() => openActionModal(item)} size="sm">
                          <PencilLine className="h-4 w-4" />
                          Take action
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                <CircleCheck className="h-6 w-6 text-[color:var(--prd-muted)]" />
                <p className="text-sm font-medium">No exception matched your search.</p>
                <p className="max-w-md text-sm leading-6 text-[color:var(--prd-muted)]">
                  Try clearing the query or search by SKU, exception id, or owner.
                </p>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {activeItem ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/18 p-4 backdrop-blur-[1px]">
          <Card className="w-full max-w-2xl border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
            <CardHeader className="border-b border-[color:var(--prd-border)]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={severityTone[activeItem.severity]}>
                      {activeItem.severity}
                    </Badge>
                    <span className="text-sm text-[color:var(--prd-muted)]">{activeItem.id}</span>
                  </div>
                  <CardTitle className="text-xl">{activeItem.title}</CardTitle>
                  <CardDescription className="max-w-xl text-sm leading-6">
                    {activeItem.recommendation}
                  </CardDescription>
                </div>
                <Button onClick={closeActionModal} size="icon" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[color:var(--prd-muted)]">
                    Assign owner
                  </span>
                  <div className="relative">
                    <UserRoundPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--prd-muted)]" />
                    <input
                      className="h-10 w-full rounded-[calc(var(--prd-radius)-2px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] pl-9 pr-3 text-sm outline-none focus:border-[color:var(--prd-primary)]"
                      onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))}
                      placeholder="Planner or team name"
                      value={draft.owner}
                    />
                  </div>
                </label>
                <label className="grid gap-2">
                  <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-[color:var(--prd-muted)]">
                    Status
                  </span>
                  <select
                    className="h-10 rounded-[calc(var(--prd-radius)-2px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] px-3 text-sm outline-none focus:border-[color:var(--prd-primary)]"
                    onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
                    value={draft.status}
                  >
                    <option value="needs_action">Needs action</option>
                    <option value="in_progress">In progress</option>
                    <option value="needs_verification">Needs verification</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[color:var(--prd-muted)]">
                  <Clock3 className="h-4 w-4" />
                  Due time
                </span>
                <input
                  className="h-10 rounded-[calc(var(--prd-radius)-2px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] px-3 text-sm outline-none focus:border-[color:var(--prd-primary)]"
                  onChange={(event) => setDraft((current) => ({ ...current, dueTime: event.target.value }))}
                  value={draft.dueTime}
                />
              </label>

              <label className="grid gap-2">
                <span className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[color:var(--prd-muted)]">
                  <AlertTriangle className="h-4 w-4" />
                  Resolution note
                </span>
                <textarea
                  className="min-h-28 rounded-[calc(var(--prd-radius)-2px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] px-3 py-2.5 text-sm leading-6 outline-none focus:border-[color:var(--prd-primary)]"
                  onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                  value={draft.note}
                />
              </label>

              <div className="flex justify-end gap-2">
                <Button onClick={closeActionModal} size="sm" variant="outline">
                  Cancel
                </Button>
                <Button onClick={saveChanges} size="sm">
                  Save update
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
