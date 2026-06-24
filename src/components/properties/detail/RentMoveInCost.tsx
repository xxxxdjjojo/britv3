"use client";

/**
 * Rent move-in cost card — LEADS the rental sidebar (where sale leads with the
 * mortgage calculator). Shows the upfront cash a tenant needs, the typical
 * income requirement, and a small affordability self-check.
 *
 * All money math is delegated to the pure, tested helpers in rental-cost.ts —
 * this component only formats and wires the income input state.
 *
 * Brand-green system only: brand-primary / success / muted tokens.
 */

import { useState } from "react";
import { KeyRound, Check, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  moveInCost,
  depositCap,
  incomeNeededAnnual,
  perRoom,
  RENT_INCOME_ANNUAL_MULTIPLE,
} from "@/lib/properties/rental-cost";

export type RentMoveInCostProps = Readonly<{
  monthlyRent: number;
  depositAmount: number | null;
  holdingDepositAmount: number | null;
  beds: number;
}>;

function gbp(amount: number): string {
  return `£${amount.toLocaleString("en-GB")}`;
}

export function RentMoveInCost({
  monthlyRent,
  depositAmount,
  holdingDepositAmount,
  beds,
}: RentMoveInCostProps) {
  const [incomeInput, setIncomeInput] = useState("");

  const cost = moveInCost({
    monthlyRent,
    deposit: depositAmount,
    holdingDeposit: holdingDepositAmount,
  });
  const cap = depositCap(monthlyRent, depositAmount);
  const incomeRequired = incomeNeededAnnual(monthlyRent);
  // For shared homes, the per-room share contextualises the income line.
  const roomShare = beds >= 2 ? perRoom(monthlyRent, beds) : null;

  const enteredIncome = Number.parseFloat(incomeInput.replace(/,/g, ""));
  const hasEnteredIncome = incomeInput.trim() !== "" && Number.isFinite(enteredIncome) && enteredIncome > 0;
  const meetsRequirement = hasEnteredIncome && enteredIncome >= incomeRequired;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="size-4 text-brand-primary" aria-hidden="true" />
          Cost to move in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Breakdown */}
        <dl className="space-y-2 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">First month&rsquo;s rent</dt>
            <dd className="font-medium tabular-nums">{gbp(cost.firstMonthRent)}</dd>
          </div>

          {cost.deposit > 0 && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Deposit</dt>
                <dd className="font-medium tabular-nums">{gbp(cost.deposit)}</dd>
              </div>
              {cap.exceeds ? (
                <p className="flex items-start gap-1 rounded-md bg-brand-gold/15 px-2 py-1 text-xs text-brand-gold-foreground">
                  <AlertTriangle className="size-3.5 shrink-0 translate-y-px" aria-hidden="true" />
                  Above the {cap.capWeeks}-week cap of {gbp(cap.capAmount)}
                </p>
              ) : (
                <p className="flex items-center gap-1 text-xs text-success">
                  <Check className="size-3.5 shrink-0" aria-hidden="true" />
                  Within the {cap.capWeeks}-week cap
                </p>
              )}
            </div>
          )}

          {cost.holdingDeposit > 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground">Holding deposit</dt>
              <dd className="font-medium tabular-nums">{gbp(cost.holdingDeposit)}</dd>
            </div>
          )}

          <div className="mt-1 flex items-baseline justify-between gap-3 border-t pt-3">
            <dt className="font-semibold">Total to move in</dt>
            <dd className="text-xl font-bold text-brand-primary tabular-nums">
              {gbp(cost.totalUpfront)}
            </dd>
          </div>
        </dl>

        {/* Income needed */}
        {incomeRequired > 0 && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Annual income usually required: </span>
              <span className="font-semibold text-brand-primary tabular-nums">{gbp(incomeRequired)}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              (about {RENT_INCOME_ANNUAL_MULTIPLE}&times; the monthly rent)
            </p>
            {roomShare != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                Sharing? About{" "}
                <span className="font-medium text-foreground">{gbp(roomShare)} pcm</span>{" "}
                per room across {beds} bedrooms.
              </p>
            )}
          </div>
        )}

        {/* Affordability mini-check */}
        <div className="space-y-1.5">
          <label htmlFor="rent-income-check" className="text-xs font-medium text-muted-foreground">
            Check your affordability
          </label>
          <div className="flex items-center rounded-md border bg-background focus-within:ring-2 focus-within:ring-brand-primary/40">
            <span className="pl-3 text-sm text-muted-foreground">£</span>
            <input
              id="rent-income-check"
              type="text"
              inputMode="numeric"
              placeholder="Your annual income"
              value={incomeInput}
              onChange={(event) => setIncomeInput(event.target.value)}
              className="w-full bg-transparent px-2 py-2 text-sm outline-none"
            />
          </div>
          {hasEnteredIncome && (
            meetsRequirement ? (
              <p className="flex items-center gap-1 text-xs font-medium text-success">
                <Check className="size-3.5 shrink-0" aria-hidden="true" />
                You meet the typical income requirement
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Below the typical requirement of{" "}
                <span className="font-medium text-foreground">{gbp(incomeRequired)}</span>
              </p>
            )
          )}
        </div>

        {/* Honesty footnote */}
        <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
          Guidance only &mdash; not a guarantee of referencing approval. Holding
          deposit is usually credited toward your first rent or deposit.
        </p>
      </CardContent>
    </Card>
  );
}
