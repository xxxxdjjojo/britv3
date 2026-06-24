import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import type { ExpensesInput } from "@/lib/properties/rent-affordability-advanced";
import { CurrencyField } from "./CurrencyField";

type Props = Readonly<{
  value: ExpensesInput;
  onChange: (patch: Partial<ExpensesInput>) => void;
}>;

const FIELDS: ReadonlyArray<{ key: keyof ExpensesInput; label: string }> = [
  { key: "utilities", label: "Utilities" },
  { key: "groceries", label: "Groceries" },
  { key: "transport", label: "Transport" },
  { key: "insurance", label: "Insurance" },
  { key: "internet", label: "Internet" },
  { key: "phone", label: "Phone" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "other", label: "Other" },
];

export function ExpensesFields({ value, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="size-4 text-primary" />
          Monthly living expenses
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
