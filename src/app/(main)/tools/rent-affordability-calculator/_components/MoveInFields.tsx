import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PiggyBank } from "lucide-react";
import type { MoveInInput } from "@/lib/properties/rent-affordability-advanced";
import { CurrencyField } from "./CurrencyField";

type Props = Readonly<{
  value: MoveInInput;
  onChange: (patch: Partial<MoveInInput>) => void;
}>;

export function MoveInFields({ value, onChange }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PiggyBank className="size-4 text-primary" />
          Upfront move-in costs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <CurrencyField
          label="Security deposit"
          value={value.securityDeposit}
          onChange={(v) => onChange({ securityDeposit: v })}
          money
        />
        <CurrencyField
          label="Admin / application fee"
          value={value.adminFee}
          onChange={(v) => onChange({ adminFee: v })}
          money
        />
        <CurrencyField
          label="Moving costs"
          value={value.movingCosts}
          onChange={(v) => onChange({ movingCosts: v })}
          money
        />
        <CurrencyField
          label="Emergency cushion"
          value={value.emergencyCushion}
          onChange={(v) => onChange({ emergencyCushion: v })}
          money
        />
        <div className="flex items-center justify-between py-1">
          <Label className="text-sm text-muted-foreground">First month&apos;s rent upfront</Label>
          <Switch
            checked={value.firstMonthUpfront}
            onCheckedChange={(checked) => onChange({ firstMonthUpfront: checked })}
          />
        </div>
        <div className="flex items-center justify-between py-1">
          <Label className="text-sm text-muted-foreground">Last month&apos;s rent upfront</Label>
          <Switch
            checked={value.lastMonthUpfront}
            onCheckedChange={(checked) => onChange({ lastMonthUpfront: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
