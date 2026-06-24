import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, PiggyBank, Receipt, Wallet, TrendingUp, type LucideIcon } from "lucide-react";
import type { AffordabilityResult } from "@/lib/properties/rent-affordability-advanced";
import { formatGBP } from "@/lib/properties/rent-affordability-format";

type Props = Readonly<{ result: AffordabilityResult }>;

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  emphasis,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  emphasis?: "positive" | "negative";
}) {
  const valueClass =
    emphasis === "positive"
      ? "text-primary"
      : emphasis === "negative"
        ? "text-red-600 dark:text-red-400"
        : "text-foreground";
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <Icon className="mx-auto mb-1 size-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export function OutgoingsSummary({ result }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Home}
          label="Max by ratio"
          value={formatGBP(result.maxRentByRatio)}
          sub="/month"
        />
        <StatCard
          icon={PiggyBank}
          label="After all costs"
          value={formatGBP(result.affordableRent)}
          sub="/month"
        />
        <StatCard
          icon={Receipt}
          label="Monthly outgoings"
          value={formatGBP(result.totalMonthlyOutgoings)}
          sub="total"
        />
        <StatCard
          icon={Wallet}
          label="Money leftover"
          value={formatGBP(Math.max(0, result.moneyLeftover))}
          sub="/month"
          emphasis={result.moneyLeftover >= 0 ? "positive" : "negative"}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" />
            Yearly projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Annual rent</p>
              <p className="text-lg font-semibold">{formatGBP(result.yearlyRent)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Annual housing (incl. utilities)</p>
              <p className="text-lg font-semibold">{formatGBP(result.yearlyHousingCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total annual outgoings</p>
              <p className="text-lg font-semibold">{formatGBP(result.yearlyOutgoings)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
