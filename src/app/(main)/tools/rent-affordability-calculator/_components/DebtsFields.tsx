import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import type { DebtsInput } from "@/lib/properties/rent-affordability-advanced";
import { CurrencyField } from "./CurrencyField";

type Props = Readonly<{
  value: DebtsInput;
  onChange: (patch: Partial<DebtsInput>) => void;
}>;

const FIELDS: ReadonlyArray<{ key: keyof DebtsInput; label: string }> = [
  { key: "studentLoans", label: "Student loans" },
  { key: "carPayment", label: "Car payment" },
  { key: "creditCards", label: "Credit cards" },
  { key: "personalLoans", label: "Personal loans" },
  { key: "otherDebts", label: "Other debts" },
];

export function DebtsFields({ value, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="size-4 text-primary" />
          Monthly debt payments
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <CurrencyField
            key={field.key}
            label={field.label}
            value={value[field.key]}
            onChange={(v) => onChange({ [field.key]: v })}
            money
          />
        ))}
      </CardContent>
    </Card>
  );
}
