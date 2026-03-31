/**
 * CashPositionWidget.tsx
 *
 * Server component — displays the provider's cash position at a glance:
 * invoiced (sent), received (paid), overdue amounts, Stripe balance, and net position.
 */

import { PoundSterling } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtGbp } from "@/lib/format-money";
import type { CashPosition } from "@/services/provider/provider-cash-position-service";

type CashPositionWidgetProps = Readonly<{
  cashPosition: CashPosition;
}>;

export function CashPositionWidget({ cashPosition }: CashPositionWidgetProps) {
  const {
    invoicedPence,
    invoicedCount,
    receivedPence,
    receivedCount,
    overduePence,
    overdueCount,
    stripeAvailablePence,
    stripePendingPence,
    netPositionPence,
  } = cashPosition;

  const hasStripeBalance = stripeAvailablePence > 0 || stripePendingPence > 0;

  return (
    <Card className="bg-white shadow-sm border-neutral-200">
      {/* Header */}
      <CardHeader className="border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
            <PoundSterling className="size-5" />
          </div>
          <CardTitle className="text-base font-semibold text-neutral-900">
            Cash Position
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Three stat grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Invoiced (sent) */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">Invoiced</p>
            <p className="text-lg font-bold text-neutral-900">{fmtGbp(invoicedPence)}</p>
            <Badge variant="secondary" className="text-xs">
              {invoicedCount} invoice{invoicedCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Received (paid) */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">Received</p>
            <p className="text-lg font-bold text-success">{fmtGbp(receivedPence)}</p>
            <Badge variant="secondary" className="text-xs">
              {receivedCount} invoice{receivedCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Overdue */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-500">Overdue</p>
            <p
              className={[
                "text-lg font-bold",
                overduePence > 0 ? "text-error" : "text-muted-foreground/40",
              ].join(" ")}
            >
              {fmtGbp(overduePence)}
            </p>
            <Badge
              variant={overdueCount > 0 ? "destructive" : "secondary"}
              className="text-xs"
            >
              {overdueCount} invoice{overdueCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Stripe balance row — only shown when there is a balance */}
        {hasStripeBalance && (
          <div className="rounded-lg bg-neutral-50 px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-neutral-500">Stripe — Available</p>
              <p className="text-sm font-semibold text-neutral-800">
                {fmtGbp(stripeAvailablePence)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">Stripe — Pending</p>
              <p className="text-sm font-semibold text-neutral-800">
                {fmtGbp(stripePendingPence)}
              </p>
            </div>
          </div>
        )}

        {/* Net position */}
        <div className="border-t border-neutral-100 pt-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-neutral-700">Net Position</p>
          <p
            className={[
              "text-xl font-black tracking-tight",
              netPositionPence >= 0 ? "text-success" : "text-error",
            ].join(" ")}
          >
            {fmtGbp(netPositionPence)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
