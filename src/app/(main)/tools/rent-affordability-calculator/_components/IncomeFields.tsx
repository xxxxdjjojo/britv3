import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import type { IncomeInput } from "@/lib/properties/rent-affordability-advanced";
import { formatGBP } from "@/lib/properties/rent-affordability-format";
import { CurrencyField } from "./CurrencyField";

type Props = Readonly<{
  value: IncomeInput;
  onChange: (patch: Partial<IncomeInput>) => void;
  showPartner?: boolean;
}>;

export function IncomeFields({ value, onChange, showPartner = true }: Props) {
  const estimatedNet = (value.annualGrossIncome / 12) * 0.78;
  const netExceedsGross =
    value.monthlyNetIncome > 0 && value.monthlyNetIncome > value.annualGrossIncome / 12;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="size-4 text-primary" />
          Your income
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CurrencyField
          label="Annual gross income (before tax)"
          value={value.annualGrossIncome}
          onChange={(v) => onChange({ annualGrossIncome: v })}
          money
          hint="Total yearly income before any deductions"
        />
        <CurrencyField
          label="Monthly take-home (after tax)"
          value={value.monthlyNetIncome}
          onChange={(v) => onChange({ monthlyNetIncome: v })}
          money
          hint={
            netExceedsGross
              ? "That's higher than your monthly gross — double-check the figure."
              : `Leave as 0 to auto-estimate (~${formatGBP(estimatedNet)})`
          }
          error={undefined}
        />
        {showPartner && (
          <CurrencyField
            label="Partner / household annual income"
            value={value.partnerAnnualIncome}
            onChange={(v) => onChange({ partnerAnnualIncome: v })}
            money
            hint="Combined household income for shared renting"
          />
        )}
      </CardContent>
    </Card>
  );
}
