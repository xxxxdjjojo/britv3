/**
 * Tenancy & deposit explainer — sits in MAIN content after the letting details
 * for rent listings. Explains the Tenant Fees Act deposit cap, deposit-scheme
 * protection, and the tenancy timeline.
 *
 * Server Component — no client state. Each block self-gates on real data; if no
 * block has data the whole card renders null (no "—" placeholders).
 *
 * Brand-green only: brand-primary / success / brand-gold caution / muted.
 * Deposit-cap math is delegated to the tested depositCap() helper.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Check, AlertTriangle, CalendarClock } from "lucide-react";
import { depositCap } from "@/lib/properties/rental-cost";
import { formatAvailableFrom } from "@/lib/properties/rental-format";

export type TenancyDepositExplainerProps = Readonly<{
  monthlyRent: number;
  depositAmount: number | null;
  depositScheme: string | null;
  availableFrom: string | null;
  minimumTenancyMonths: number | null;
  maximumTenancyMonths: number | null;
}>;

function gbp(amount: number): string {
  return `£${amount.toLocaleString("en-GB")}`;
}

export function TenancyDepositExplainer({
  monthlyRent,
  depositAmount,
  depositScheme,
  availableFrom,
  minimumTenancyMonths,
  maximumTenancyMonths,
}: TenancyDepositExplainerProps) {
  const hasDeposit = depositAmount != null && depositAmount > 0;
  const cap = hasDeposit ? depositCap(monthlyRent, depositAmount) : null;

  const availableStr = formatAvailableFrom(availableFrom);
  const hasMinTenancy = minimumTenancyMonths != null && minimumTenancyMonths > 0;
  const hasTimeline = Boolean(availableStr) || hasMinTenancy;

  const hasAnyBlock = Boolean(cap) || Boolean(depositScheme) || hasTimeline;
  if (!hasAnyBlock) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-brand-primary" aria-hidden="true" />
          Your deposit &amp; tenancy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Deposit cap check (Tenant Fees Act 2019) */}
        {cap && hasDeposit && (
          cap.exceeds ? (
            <div className="rounded-lg bg-brand-gold/15 p-3">
              <p className="flex items-start gap-2 text-sm text-brand-gold-foreground">
                <AlertTriangle className="size-4 shrink-0 translate-y-px" aria-hidden="true" />
                <span>
                  This deposit ({gbp(depositAmount)}) is above the Tenant Fees
                  Act {cap.capWeeks}-week cap ({gbp(cap.capAmount)}).
                </span>
              </p>
              <p className="mt-1.5 pl-6 text-xs text-muted-foreground">
                Under the Tenant Fees Act 2019, a security deposit cannot exceed
                {" "}{cap.capWeeks} weeks&rsquo; rent.
              </p>
            </div>
          ) : (
            <div>
              <p className="flex items-start gap-2 text-sm text-success">
                <Check className="size-4 shrink-0 translate-y-px" aria-hidden="true" />
                <span className="text-foreground">
                  Deposit is within the Tenant Fees Act {cap.capWeeks}-week cap
                  ({gbp(cap.capAmount)}).
                </span>
              </p>
              <p className="mt-1 pl-6 text-xs text-muted-foreground">
                Tenant Fees Act 2019 &mdash; security deposits are capped at{" "}
                {cap.capWeeks} weeks&rsquo; rent.
              </p>
            </div>
          )
        )}

        {/* Deposit protection scheme */}
        {depositScheme && (
          <div>
            <p className="flex items-start gap-2 text-sm">
              <ShieldCheck className="size-4 shrink-0 translate-y-px text-brand-primary" aria-hidden="true" />
              <span>
                Protected in a government-approved scheme:{" "}
                <span className="font-medium">{depositScheme}</span>.
              </span>
            </p>
            <p className="mt-1 pl-6 text-xs text-muted-foreground">
              Your deposit must be protected within 30 days of payment.
            </p>
          </div>
        )}

        {/* Tenancy timeline */}
        {hasTimeline && (
          <div>
            <p className="mb-3 flex items-center gap-2 text-sm font-medium">
              <CalendarClock className="size-4 text-brand-primary" aria-hidden="true" />
              Tenancy timeline
            </p>
            <ol className="relative space-y-4 border-l border-brand-primary/25 pl-5">
              {availableStr && (
                <li className="relative">
                  <span className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full bg-brand-primary ring-4 ring-brand-primary/15" />
                  <p className="text-sm font-medium">Available from</p>
                  <p className="text-sm text-muted-foreground">{availableStr}</p>
                </li>
              )}
              {hasMinTenancy && (
                <li className="relative">
                  <span className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full bg-brand-primary/60 ring-4 ring-brand-primary/10" />
                  <p className="text-sm font-medium">
                    Minimum tenancy {minimumTenancyMonths} months
                  </p>
                  {maximumTenancyMonths != null && maximumTenancyMonths > 0 && (
                    <p className="text-sm text-muted-foreground">
                      up to {maximumTenancyMonths} months
                    </p>
                  )}
                </li>
              )}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
