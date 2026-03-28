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
    <Card className="max-w-2xl border-[color:var(--prd-border)] bg-[color:var(--prd-panel)] shadow-[var(--prd-shadow)]">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-4">
          <Badge className="bg-[color:color-mix(in_srgb,var(--prd-primary)_12%,white)] text-[color:var(--prd-primary)]">
            Payment timeout
          </Badge>
          <div className="flex items-center gap-2 text-sm text-[color:var(--prd-muted)]">
            <ShieldCheck className="h-4 w-4" />
            Safe state preserved
          </div>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-3xl leading-tight">
            Continue checkout without losing your progress
          </CardTitle>
          <CardDescription>
            We saved your cart and shipping details. Review what was preserved, then retry payment when you are ready.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-[calc(var(--prd-radius)-8px)] border border-[color:var(--prd-border)] bg-[color:var(--prd-surface)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--prd-primary)]">
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
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Retry payment
          </Button>
          <Button variant="ghost">Save cart and come back later</Button>
        </div>
      </CardContent>
    </Card>
  );
}
