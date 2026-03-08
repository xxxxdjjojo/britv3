"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  calculateMonthlyPayment,
  calculateTotalRepayable,
} from "@/lib/calculators/mortgage";
import { useMortgageParams } from "@/hooks/useMortgageParams";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

export function MortgageCalculator() {
  const { saveParams, hasParams } = useMortgageParams();

  const [propertyPrice, setPropertyPrice] = useState(300000);
  const [deposit, setDeposit] = useState(30000);
  const [interestRate, setInterestRate] = useState(4.5);
  const [termYears, setTermYears] = useState(25);

  const depositPercent = useMemo(() => {
    if (propertyPrice <= 0) return 0;
    return Math.round((deposit / propertyPrice) * 1000) / 10;
  }, [deposit, propertyPrice]);

  const loanAmount = useMemo(
    () => Math.max(0, propertyPrice - deposit),
    [propertyPrice, deposit],
  );

  const results = useMemo(() => {
    const monthlyPayment = calculateMonthlyPayment(
      loanAmount,
      interestRate,
      termYears,
    );
    const { totalRepayable, totalInterest } = calculateTotalRepayable(
      loanAmount,
      interestRate,
      termYears,
    );
    const ltv = propertyPrice > 0 ? (loanAmount / propertyPrice) * 100 : 0;

    return { monthlyPayment, totalRepayable, totalInterest, ltv };
  }, [loanAmount, interestRate, termYears, propertyPrice]);

  const handleSaveParams = () => {
    saveParams({ deposit, interestRate, termYears });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mortgage Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="property-price">Property Price</Label>
            <Input
              id="property-price"
              type="number"
              min={0}
              step={1000}
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="deposit">Deposit</Label>
              <span className="text-muted-foreground text-sm">
                {depositPercent}%
              </span>
            </div>
            <Input
              id="deposit"
              type="number"
              min={0}
              step={1000}
              value={deposit}
              onChange={(e) => setDeposit(Number(e.target.value))}
            />
            <Slider
              min={0}
              max={propertyPrice}
              step={1000}
              value={[deposit]}
              onValueChange={(val) => setDeposit(Array.isArray(val) ? val[0] : val)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest-rate">Interest Rate (%)</Label>
            <Input
              id="interest-rate"
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="term">Term (years)</Label>
              <span className="text-muted-foreground text-sm">
                {termYears} years
              </span>
            </div>
            <Slider
              min={5}
              max={40}
              step={1}
              value={[termYears]}
              onValueChange={(val) => setTermYears(Array.isArray(val) ? val[0] : val)}
            />
          </div>

          <Button onClick={handleSaveParams} variant="outline" className="w-full">
            {hasParams ? "Update Saved Parameters" : "Save These Parameters"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-muted-foreground text-sm">Monthly Payment</p>
            <p className="text-primary text-3xl font-bold">
              {formatCurrency(results.monthlyPayment)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-muted-foreground text-xs">Total Repayable</p>
              <p className="text-lg font-semibold">
                {formatCurrency(results.totalRepayable)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <p className="text-muted-foreground text-xs">Total Interest</p>
              <p className="text-lg font-semibold">
                {formatCurrency(results.totalInterest)}
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-3 text-center">
            <p className="text-muted-foreground text-xs">Loan-to-Value (LTV)</p>
            <p className="text-lg font-semibold">
              {results.ltv.toFixed(1)}%
            </p>
          </div>

          <div className="rounded-lg border p-3 text-center">
            <p className="text-muted-foreground text-xs">Loan Amount</p>
            <p className="text-lg font-semibold">
              {formatCurrency(loanAmount)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
