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
    <Card className="border-border bg-white shadow-sm">
      {/* Header */}
      <CardHeader className="border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#E8F5EE] text-brand-primary">
            <PoundSterling className="size-5" />
          </div>
          <CardTitle className="font-heading text-lg font-bold tracking-tight text-neutral-900">
            Cash Position
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Three stat grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Invoiced (sent) */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">Invoiced</p>
            <p className="font-heading text-xl font-bold tracking-tight text-neutral-900">{fmtGbp(invoicedPence)}</p>
            <Badge variant="secondary" className="text-xs">
              {invoicedCount} invoice{invoicedCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Received (paid) */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">Received</p>
            <p className="font-heading text-xl font-bold tracking-tight text-success">{fmtGbp(receivedPence)}</p>
            <Badge variant="secondary" className="text-xs">
              {receivedCount} invoice{receivedCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Overdue */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">Overdue</p>
            <p
              className={[
                "font-heading text-xl font-bold tracking-tight",
                overduePence > 0 ? "text-error" : "text-neutral-400",
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
          <div className="flex items-center justify-between gap-4 rounded-lg bg-surface px-4 py-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">Stripe — Available</p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-800">
                {fmtGbp(stripeAvailablePence)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400">Stripe — Pending</p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-800">
                {fmtGbp(stripePendingPence)}
              </p>
            </div>
          </div>
        )}

        {/* Net position */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
          <p className="text-sm font-semibold text-neutral-700">Net Position</p>
          <p
            className={[
              "font-heading text-2xl font-black tracking-tight",
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
