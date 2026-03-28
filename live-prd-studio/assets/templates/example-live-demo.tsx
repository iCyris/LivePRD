import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RetryCard() {
  return (
    <Card className="max-w-xl border-[var(--prd-border)] bg-[var(--prd-surface)] text-[var(--prd-text)] shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-[var(--prd-primary)]">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Payment timeout</span>
        </div>
        <CardTitle className="text-2xl">Continue checkout without losing your progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-[color-mix(in_srgb,var(--prd-text)_80%,white)]">
          We saved your cart and shipping details. Review the status below, then retry payment when you are ready.
        </p>
        <div className="rounded-2xl border border-[var(--prd-border)] bg-[var(--prd-surface-alt)] p-4">
          <p className="text-sm font-medium">Preserved state</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Cart items kept</li>
            <li>Shipping address kept</li>
            <li>Payment authorization not captured</li>
          </ul>
        </div>
        <Button className="gap-2 bg-[var(--prd-primary)] text-white hover:opacity-95">
          <RefreshCcw className="h-4 w-4" />
          Retry payment
        </Button>
      </CardContent>
    </Card>
  );
}

export default RetryCard;
