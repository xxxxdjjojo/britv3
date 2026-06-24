import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank } from "lucide-react";
import { formatGBP } from "@/lib/properties/rent-affordability-format";

type Props = Readonly<{ moveInTotal: number }>;

export function MoveInSummary({ moveInTotal }: Props) {
  if (moveInTotal <= 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PiggyBank className="size-4 text-primary" />
          Upfront move-in costs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{formatGBP(moveInTotal)}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Security deposit + fees + any upfront rent + moving costs + emergency cushion.
        </p>
      </CardContent>
    </Card>
  );
}
