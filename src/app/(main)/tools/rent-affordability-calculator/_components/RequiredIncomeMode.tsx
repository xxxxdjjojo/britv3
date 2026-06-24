"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Home } from "lucide-react";
import { computeRequiredIncome } from "@/lib/properties/rent-affordability-advanced";
import { formatGBP } from "@/lib/properties/rent-affordability-format";
import { CurrencyField } from "./CurrencyField";
import { RentReferenceTable } from "./RentReferenceTable";
import { DisclaimerNote } from "./DisclaimerNote";

function sliderValue(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

export function RequiredIncomeMode() {
  const [targetRent, setTargetRent] = useState(1_000);
  const [rentToIncomeRatio, setRentToIncomeRatio] = useState(30);

  const result = useMemo(
    () => computeRequiredIncome({ targetRent, rentToIncomeRatio }),
    [targetRent, rentToIncomeRatio],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="size-4 text-primary" />
              Target rent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <CurrencyField
              label="Monthly rent you want to afford"
              value={targetRent}
              onChange={setTargetRent}
              money
              hint="The monthly rent of the property you're considering"
            />
            <div>
              <div className="mb-2 flex justify-between">
                <Label className="text-sm font-medium">Required income rule</Label>
                <Badge variant="secondary" className="font-mono text-xs">
                  {rentToIncomeRatio}%
                </Badge>
              </div>
              <Slider
                value={[rentToIncomeRatio]}
                onValueChange={(v) => setRentToIncomeRatio(sliderValue(v))}
                min={20}
                max={40}
                step={5}
              />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Strict (20%)</span>
                <span>Standard (30%)</span>
                <span>Lenient (40%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-7">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">To afford a monthly rent of</p>
              <p className="text-4xl font-bold">{formatGBP(targetRent)}</p>
              <p className="text-sm text-muted-foreground">
                you need an annual gross income of at least
              </p>
              <p className="font-heading text-4xl font-bold text-primary">
                {formatGBP(result.requiredAnnualGross)}
              </p>
              <Badge variant="outline" className="text-xs">
                Based on the {rentToIncomeRatio}% rent-to-income rule
              </Badge>
            </div>
            <Separator className="my-6" />
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/40 p-4 text-center">
                <p className="text-xs text-muted-foreground">Required monthly gross</p>
                <p className="text-xl font-bold">{formatGBP(result.requiredMonthlyGross)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-4 text-center">
                <p className="text-xs text-muted-foreground">Est. monthly net (after tax)</p>
                <p className="text-xl font-bold">{formatGBP(result.estMonthlyNet)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <RentReferenceTable />
        <DisclaimerNote />
      </div>
    </div>
  );
}
