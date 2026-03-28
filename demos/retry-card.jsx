import { AlertCircle, RefreshCcw, ShieldCheck } from "lucide-react";

import { Badge } from "../apps/web/src/components/ui/badge.jsx";
import { Button } from "../apps/web/src/components/ui/button.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../apps/web/src/components/ui/card.jsx";

export default function RetryCard() {
  return (
    <Card className="max-w-xl border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-4">
          <Badge className="border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] text-[color:var(--prd-text)]">
            Payment timeout
          </Badge>
          <div className="flex items-center gap-2 text-xs text-[color:var(--prd-muted)]">
            <ShieldCheck className="h-4 w-4" />
            Safe state preserved
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-[26px] leading-tight tracking-tight">
            Continue checkout without losing your progress
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            We saved your cart and shipping details. Review what was preserved, then retry payment when you are ready.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[calc(var(--prd-radius)-2px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--prd-muted)]">
            <AlertCircle className="h-4 w-4" />
            Preserved state
          </div>
          <ul className="space-y-2 text-sm text-[color:var(--prd-text)]">
            <li>Cart items kept</li>
            <li>Shipping address kept</li>
            <li>Promo code kept</li>
            <li>Payment authorization not captured</li>
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" size="sm">
            <RefreshCcw className="h-4 w-4" />
            Retry payment
          </Button>
          <Button size="sm" variant="outline">Save cart and come back later</Button>
        </div>
      </CardContent>
    </Card>
  );
}
