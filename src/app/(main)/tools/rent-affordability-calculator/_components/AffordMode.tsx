"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Gauge,
  Receipt,
  PiggyBank,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import {
  computeAffordability,
  type IncomeInput,
  type DebtsInput,
  type ExpensesInput,
  type MoveInInput,
} from "@/lib/properties/rent-affordability-advanced";
import { formatGBP } from "@/lib/properties/rent-affordability-format";
import { IncomeFields } from "./IncomeFields";
import { DebtsFields } from "./DebtsFields";
import { ExpensesFields } from "./ExpensesFields";
import { MoveInFields } from "./MoveInFields";
import { CurrencyField } from "./CurrencyField";
import { ResultHeadlineCard } from "./ResultHeadlineCard";
import { RiskGauge } from "./RiskGauge";
import { OutgoingsSummary } from "./OutgoingsSummary";
import { BudgetPieChart } from "./BudgetPieChart";
import { BudgetSplitBar } from "./BudgetSplitBar";
import { MoveInSummary } from "./MoveInSummary";
import { SearchRentalsCTA } from "./SearchRentalsCTA";
import { DisclaimerNote } from "./DisclaimerNote";

const DEFAULT_INCOME: IncomeInput = {
  annualGrossIncome: 35_000,
  monthlyNetIncome: 0,
  partnerAnnualIncome: 0,
};
const DEFAULT_DEBTS: DebtsInput = {
  studentLoans: 0,
  carPayment: 0,
  creditCards: 0,
  personalLoans: 0,
  otherDebts: 0,
};
const DEFAULT_EXPENSES: ExpensesInput = {
  utilities: 150,
  groceries: 300,
  transport: 100,
  insurance: 30,
  subscriptions: 40,
  internet: 35,
  phone: 25,
  other: 0,
};
const DEFAULT_MOVE_IN: MoveInInput = {
  securityDeposit: 1_000,
  adminFee: 150,
  firstMonthUpfront: true,
  lastMonthUpfront: false,
  movingCosts: 300,
  emergencyCushion: 500,
};

const TIPS = [
  "Most landlords require an income of 2.5–3× the monthly rent.",
  "The 30% rule is a guideline — adjust it for your debts and savings goals.",
  "Don't forget hidden costs: utilities, internet, contents insurance, parking.",
  "Aim to keep 3–6 months of expenses saved as an emergency fund.",
];

function sliderValue(v: number | readonly number[]): number {
  return Array.isArray(v) ? v[0] : (v as number);
}

export function AffordMode() {
  const [income, setIncome] = useState<IncomeInput>(DEFAULT_INCOME);
  const [rentToIncomeRatio, setRentToIncomeRatio] = useState(30);
  const [savingsGoal, setSavingsGoal] = useState(10);
  const [currentRent, setCurrentRent] = useState(0);
  const [debts, setDebts] = useState<DebtsInput>(DEFAULT_DEBTS);
  const [expenses, setExpenses] = useState<ExpensesInput>(DEFAULT_EXPENSES);
  const [moveIn, setMoveIn] = useState<MoveInInput>(DEFAULT_MOVE_IN);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMoveIn, setShowMoveIn] = useState(false);

  const result = useMemo(
    () =>
      computeAffordability({
        income,
        rentToIncomeRatio,
        savingsGoal,
        currentRent,
        debts,
        expenses,
        moveIn,
      }),
    [income, rentToIncomeRatio, savingsGoal, currentRent, debts, expenses, moveIn],
  );

  const hasIncome = result.totalMonthlyIncome > 0;
  const usingSuggested = currentRent <= 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Inputs */}
      <div className="space-y-6 lg:col-span-5">
        <IncomeFields value={income} onChange={(patch) => setIncome((p) => ({ ...p, ...patch }))} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="size-4 text-primary" />
              Budget rule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between">
                <Label className="text-sm font-medium">Rent-to-income ratio</Label>
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
                <span>Conservative (20%)</span>
                <span>Standard (30%)</span>
                <span>Aggressive (40%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm text-muted-foreground">Savings goal (% of net)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={savingsGoal || ""}
                  onChange={(e) =>
                    setSavingsGoal(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                  }
                  className="h-9 w-20 text-right"
                  min={0}
                  max={100}
                  aria-label="Savings goal percentage"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <CurrencyField
              label="Rent you're considering (optional)"
              value={currentRent}
              onChange={setCurrentRent}
              money
              hint="Leave blank to assess your suggested maximum rent."
            />
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          onClick={() => setShowAdvanced((s) => !s)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <Receipt className="size-4" /> Debts &amp; expenses
          </span>
          {showAdvanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
        {showAdvanced && (
          <div className="space-y-4">
            <DebtsFields value={debts} onChange={(patch) => setDebts((p) => ({ ...p, ...patch }))} />
            <ExpensesFields
              value={expenses}
              onChange={(patch) => setExpenses((p) => ({ ...p, ...patch }))}
            />
          </div>
        )}

        <Button
          variant="ghost"
          onClick={() => setShowMoveIn((s) => !s)}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2">
            <PiggyBank className="size-4" /> Move-in cost estimator
          </span>
          {showMoveIn ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
        {showMoveIn && (
          <MoveInFields value={moveIn} onChange={(patch) => setMoveIn((p) => ({ ...p, ...patch }))} />
        )}
      </div>

      {/* Results */}
      <div className="space-y-6 lg:col-span-7">
        {hasIncome ? (
          <>
            <ResultHeadlineCard
              amount={result.suggestedRent}
              eyebrow="Suggested maximum rent"
              caption={`The more cautious of your ${rentToIncomeRatio}% rule and what's left after your costs.`}
              footnote={`Total monthly income: ${formatGBP(result.totalMonthlyIncome)} gross${
                income.partnerAnnualIncome > 0 ? " (includes partner/household)" : ""
              }`}
            />
            <RiskGauge
              ratio={result.currentRatio}
              band={result.riskBand}
              usingSuggested={usingSuggested}
            />
            <OutgoingsSummary result={result} />
            <BudgetPieChart slices={result.budgetSlices} />
            <BudgetSplitBar
              needsPercent={result.needsPercent}
              wantsPercent={result.wantsPercent}
              savingsPercent={result.savingsPercent}
            />
            <MoveInSummary moveInTotal={result.moveInTotal} />
            <SearchRentalsCTA maxPrice={result.suggestedRent} />
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Lightbulb className="size-4 text-primary" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {TIPS.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-primary" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="p-8">
            <CardContent className="flex flex-col items-center gap-3 p-0 text-center">
              <Gauge className="size-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Enter your annual gross income to see what rent you can afford.
              </p>
            </CardContent>
          </Card>
        )}
        <DisclaimerNote />
      </div>
    </div>
  );
}
