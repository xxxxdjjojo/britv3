"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Home, Users, Wallet, PiggyBank } from "lucide-react";
import { computeRoommateSplit } from "@/lib/properties/rent-affordability-advanced";
import { formatGBP } from "@/lib/properties/rent-affordability-format";
import { CurrencyField } from "./CurrencyField";
import { RoommateBreakdownTable } from "./RoommateBreakdownTable";
import { DisclaimerNote } from "./DisclaimerNote";

function sliderValue(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

const TONE_TEXT: Record<string, { label: string; className: string }> = {
  affordable: { label: " — Affordable!", className: "text-primary" },
  stretched: { label: " — A bit stretched", className: "text-amber-600 dark:text-amber-400" },
  high: { label: " — Consider a lower share", className: "text-red-600 dark:text-red-400" },
};

export function RoommateMode() {
  const [totalRent, setTotalRent] = useState(2_000);
  const [numRoommates, setNumRoommates] = useState(1);
  const [includeUtilities, setIncludeUtilities] = useState(true);
  const [monthlyUtilities, setMonthlyUtilities] = useState(150);
  const [splitMethod, setSplitMethod] = useState<"equal" | "unequal">("equal");
  const [yourSharePercent, setYourSharePercent] = useState(50);
  const [yourAnnualGrossIncome, setYourAnnualGrossIncome] = useState(35_000);

  const result = useMemo(
    () =>
      computeRoommateSplit({
        totalRent,
        numRoommates,
        splitMethod,
        yourSharePercent,
        includeUtilities,
        monthlyUtilities,
        yourAnnualGrossIncome,
      }),
    [
      totalRent,
      numRoommates,
      splitMethod,
      yourSharePercent,
      includeUtilities,
      monthlyUtilities,
      yourAnnualGrossIncome,
    ],
  );

  const tone = TONE_TEXT[result.affordabilityTone];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="size-4 text-primary" />
              Rent details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CurrencyField
              label="Total monthly rent"
              value={totalRent}
              onChange={setTotalRent}
              money
            />
            <CurrencyField
              label="Number of roommates (excluding you)"
              value={numRoommates}
              onChange={setNumRoommates}
              min={1}
              max={10}
            />
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Include utilities in split</Label>
              <Switch checked={includeUtilities} onCheckedChange={setIncludeUtilities} />
            </div>
            {includeUtilities && (
              <CurrencyField
                label="Monthly utilities"
                value={monthlyUtilities}
                onChange={setMonthlyUtilities}
                money
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              Split method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={splitMethod === "equal" ? "default" : "outline"}
                onClick={() => setSplitMethod("equal")}
              >
                Equal split
              </Button>
              <Button
                variant={splitMethod === "unequal" ? "default" : "outline"}
                onClick={() => setSplitMethod("unequal")}
              >
                Custom %
              </Button>
            </div>
            {splitMethod === "unequal" && (
              <div>
                <div className="mb-2 flex justify-between">
                  <Label className="text-sm text-muted-foreground">Your share of rent</Label>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {yourSharePercent}%
                  </Badge>
                </div>
                <Slider
                  value={[yourSharePercent]}
                  onValueChange={(v) => setYourSharePercent(sliderValue(v))}
                  min={10}
                  max={90}
                  step={5}
                />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Smaller room (10%)</span>
                  <span>Master suite (90%)</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4 text-primary" />
              Your income (optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CurrencyField
              label="Your annual gross income"
              value={yourAnnualGrossIncome}
              onChange={setYourAnnualGrossIncome}
              money
              hint="Used to check if your share is affordable"
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-7">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">Your monthly share</p>
              <p className="text-5xl font-bold">{formatGBP(result.yourRentShare)}</p>
              <p className="text-sm text-muted-foreground">
                of {formatGBP(totalRent)} total rent
                {splitMethod === "equal"
                  ? ` split equally among ${result.totalPeople} people`
                  : ` with your ${yourSharePercent}% share`}
              </p>
              {includeUtilities && (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm text-muted-foreground">+ Your share of utilities</p>
                  <p className="text-2xl font-bold">{formatGBP(result.utilitiesPerPerson)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatGBP(monthlyUtilities)} / {result.totalPeople} people
                  </p>
                </>
              )}
              <Separator className="my-4" />
              <p className="text-sm font-medium text-muted-foreground">
                Your total monthly housing cost
              </p>
              <p className="font-heading text-3xl font-bold text-primary">
                {formatGBP(result.yourTotalMonthly)}
              </p>
              {yourAnnualGrossIncome > 0 && tone && (
                <p className="text-xs text-muted-foreground">
                  That&apos;s {Math.round(result.roommateRatio)}% of your gross income
                  <span className={`font-medium ${tone.className}`}>{tone.label}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <RoommateBreakdownTable people={result.breakdown} includeUtilities={includeUtilities} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="size-4 text-primary" />
              Per-person move-in estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              If the group puts down a deposit of {formatGBP(totalRent)} (one month&apos;s rent) plus
              the first month upfront:
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground">Deposit / person</p>
                <p className="text-lg font-semibold">{formatGBP(result.depositPerPerson)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground">First month (your share)</p>
                <p className="text-lg font-semibold">{formatGBP(result.firstMonthPerPerson)}</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-xs text-muted-foreground">Your total upfront</p>
                <p className="text-lg font-semibold text-primary">
                  {formatGBP(result.yourTotalUpfront)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <DisclaimerNote />
      </div>
    </div>
  );
}
