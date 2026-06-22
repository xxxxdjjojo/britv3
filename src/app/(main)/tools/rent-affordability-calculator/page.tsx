"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Info, AlertTriangle } from "lucide-react";
import {
  calculateRentAffordability,
  validateAffordabilityInput,
  type RentAffordabilityInput,
} from "@/lib/properties/rent-affordability";

function parseNum(value: string): number {
  if (value === "") return 0;
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
}

const formatGBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function RentAffordabilityCalculatorPage() {
  const [takeHome, setTakeHome] = useState("");
  const [outgoings, setOutgoings] = useState("");
  const [debt, setDebt] = useState("");

  const input: RentAffordabilityInput = useMemo(
    () => ({
      monthlyTakeHome: parseNum(takeHome),
      essentialOutgoings: parseNum(outgoings),
      existingDebt: parseNum(debt),
    }),
    [takeHome, outgoings, debt],
  );

  const errors = useMemo(
    () => validateAffordabilityInput(input),
    [input],
  );

  const result = useMemo(
    () => calculateRentAffordability(input),
    [input],
  );

  const hasValidInput = input.monthlyTakeHome > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b bg-gradient-to-br from-primary/5 to-background">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <nav aria-label="Breadcrumb" className="mb-4 flex text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Link href="/renter-tools" className="hover:text-foreground">Renter tools</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">Rent affordability</span>
          </nav>
          <h1 className="mb-3 font-heading text-4xl font-bold">
            Rent affordability calculator
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            See what rent you can comfortably afford based on your take-home pay and outgoings.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Form */}
          <div className="lg:col-span-7">
            <Card className="p-8">
              <CardContent className="p-0">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold">Your monthly finances</h2>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-sm font-semibold">
                      Monthly take-home pay
                    </Label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      After tax and National Insurance
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        type="number"
                        placeholder="2,800"
                        className="pl-8"
                        value={takeHome}
                        onChange={(e) => setTakeHome(e.target.value)}
                        aria-label="Monthly take-home pay"
                      />
                    </div>
                    {errors.monthlyTakeHome && (
                      <p className="mt-1 text-xs text-destructive" role="alert">
                        {errors.monthlyTakeHome}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-semibold">
                      Essential monthly outgoings
                    </Label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Food, transport, utilities, childcare (excluding rent)
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        type="number"
                        placeholder="600"
                        className="pl-8"
                        value={outgoings}
                        onChange={(e) => setOutgoings(e.target.value)}
                        aria-label="Essential monthly outgoings"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-semibold">
                      Monthly debt repayments
                    </Label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Loans, credit cards, car finance
                    </p>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                      <Input
                        type="number"
                        placeholder="200"
                        className="pl-8"
                        value={debt}
                        onChange={(e) => setDebt(e.target.value)}
                        aria-label="Monthly debt repayments"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-4">
              {hasValidInput ? (
                <>
                  {/* Main result */}
                  <div className="relative overflow-hidden rounded-xl bg-primary p-8 text-white shadow-xl">
                    <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
                      Recommended max monthly rent
                    </p>
                    <h3 className="mb-4 text-5xl font-extrabold">
                      {formatGBP.format(result.maxRent)}
                    </h3>
                    <div className="h-px w-full bg-white/10" />
                    <div className="mt-4 space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-sm text-primary-foreground/70">Weekly equivalent</p>
                          <p className="text-xl font-bold">
                            {formatGBP.format(result.maxRentWeekly)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-primary-foreground/70">% of take-home</p>
                          <p className="text-xl font-bold">{result.ratio}%</p>
                        </div>
                      </div>
                      {/* Affordability bar */}
                      <div className="mt-3">
                        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all ${
                              result.isStretched ? "bg-amber-400" : "bg-green-400"
                            }`}
                            style={{ width: `${Math.min(100, result.ratio * 2)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-primary-foreground/70">
                          {result.isStretched
                            ? "This stretches your budget. Consider a lower rent."
                            : "Comfortable range — within 30% of your take-home."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Deposit estimate */}
                  <Card className="p-6">
                    <CardContent className="p-0">
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Estimated upfront costs
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Deposit (5 weeks)</span>
                          <span className="text-sm font-bold">{formatGBP.format(result.recommendedDeposit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Holding deposit (1 week)</span>
                          <span className="text-sm font-bold">{formatGBP.format(result.recommendedHoldingDeposit)}</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Total upfront</span>
                            <span className="text-sm font-bold">
                              {formatGBP.format(result.recommendedDeposit + result.recommendedHoldingDeposit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* CTA */}
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/search?type=rent&maxPrice=${result.maxRent}`}>
                      Search rentals in your budget
                    </Link>
                  </Button>

                  {result.isStretched && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        At this rent level, housing costs would exceed 35% of your take-home pay.
                        Consider a lower budget or reducing other commitments.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-8">
                  <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
                    <Calculator className="size-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Enter your monthly take-home pay to see your recommended rent.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Disclaimer */}
              <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  This is a guidance tool using the 30% affordability rule.
                  It does not guarantee landlord or referencing approval. Individual
                  circumstances and lender/agent criteria may vary.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
