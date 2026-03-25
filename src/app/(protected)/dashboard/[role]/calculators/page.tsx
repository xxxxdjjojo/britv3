"use client";

import { use, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateMonthlyPayment, calculateTotalRepayable } from "@/lib/calculators/mortgage";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import type { BuyerType } from "@/types/calculators";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);

const gbpExact = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);

// ---------------------------------------------------------------------------
// Hardcoded illustrative mortgage rates
// ---------------------------------------------------------------------------

type MortgageProduct = {
  lender: string;
  product: string;
  ltv: string;
  rate: number;
  aprc: number;
  type: string;
};

const MORTGAGE_PRODUCTS: MortgageProduct[] = [
  { lender: "Barclays", product: "2-Year Fixed", ltv: "60%", rate: 4.15, aprc: 6.9, type: "Fixed" },
  { lender: "Barclays", product: "5-Year Fixed", ltv: "60%", rate: 4.05, aprc: 6.5, type: "Fixed" },
  { lender: "HSBC", product: "2-Year Fixed", ltv: "75%", rate: 4.45, aprc: 7.1, type: "Fixed" },
  { lender: "HSBC", product: "5-Year Fixed", ltv: "75%", rate: 4.35, aprc: 6.8, type: "Fixed" },
  { lender: "NatWest", product: "2-Year Fixed", ltv: "85%", rate: 4.89, aprc: 7.4, type: "Fixed" },
  { lender: "NatWest", product: "5-Year Fixed", ltv: "85%", rate: 4.79, aprc: 7.1, type: "Fixed" },
  { lender: "Halifax", product: "2-Year Fixed", ltv: "90%", rate: 5.24, aprc: 7.8, type: "Fixed" },
  { lender: "Halifax", product: "5-Year Fixed", ltv: "90%", rate: 5.19, aprc: 7.5, type: "Fixed" },
  { lender: "Santander", product: "Tracker", ltv: "75%", rate: 4.74, aprc: 6.9, type: "Tracker" },
  { lender: "Nationwide", product: "2-Year Fixed", ltv: "60%", rate: 4.19, aprc: 6.9, type: "Fixed" },
];

// ---------------------------------------------------------------------------
// Result Row component
// ---------------------------------------------------------------------------

function ResultRow({ label, value, highlight = false }: Readonly<{ label: string; value: string; highlight?: boolean }>) {
  return (
    <div className={`flex items-center justify-between py-3 border-b last:border-b-0 ${highlight ? "text-blue-700 dark:text-blue-400 font-semibold" : ""}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Affordability Calculator
// ---------------------------------------------------------------------------

function AffordabilityCalculator() {
  const [annualIncome, setAnnualIncome] = useState(60000);
  const [partnerIncome, setPartnerIncome] = useState(0);
  const [deposit, setDeposit] = useState(50000);
  const [term, setTerm] = useState(25);
  const [rate, setRate] = useState(5.0);
  const [buyerType, setBuyerType] = useState<BuyerType>("standard");

  // Derived calculations — pure inline, no useEffect needed
  const maxBorrowing = (annualIncome + partnerIncome) * 4.5;
  const maxPropertyPrice = maxBorrowing + deposit;
  const monthlyPayment = calculateMonthlyPayment(maxBorrowing, rate, term);
  const { totalRepayable } = calculateTotalRepayable(maxBorrowing, rate, term);
  const sdltResult = calculateSdlt(maxPropertyPrice, buyerType);
  const stampDuty = sdltResult.totalTax;
  const legalFees = 3000;
  const surveyFee = 750;
  const totalCostToBuy = deposit + stampDuty + legalFees + surveyFee;

  const handleNumberInput = (
    setter: (v: number) => void,
    min = 0,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed >= min) setter(parsed);
    else if (e.target.value === "" || e.target.value === "-") setter(0);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Details</CardTitle>
          <CardDescription>Enter your income and purchase details to estimate affordability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="annual-income">Annual Income (£)</Label>
            <Input
              id="annual-income"
              type="number"
              min={0}
              step={1000}
              value={annualIncome}
              onChange={handleNumberInput(setAnnualIncome)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-income">Partner Income (£) — optional</Label>
            <Input
              id="partner-income"
              type="number"
              min={0}
              step={1000}
              value={partnerIncome}
              onChange={handleNumberInput(setPartnerIncome)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit">Deposit (£)</Label>
            <Input
              id="deposit"
              type="number"
              min={0}
              step={1000}
              value={deposit}
              onChange={handleNumberInput(setDeposit)}
            />
          </div>

          <div className="space-y-3">
            <Label>Mortgage Term: <span className="font-semibold">{term} years</span></Label>
            <Slider
              min={5}
              max={40}
              step={1}
              value={[term]}
              onValueChange={(vals) => setTerm((vals as number[])[0] ?? term)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5 yrs</span>
              <span>40 yrs</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Interest Rate: <span className="font-semibold">{rate.toFixed(1)}%</span></Label>
            <Slider
              min={0.1}
              max={15}
              step={0.1}
              value={[rate]}
              onValueChange={(vals) => setRate((vals as number[])[0] ?? rate)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.1%</span>
              <span>15%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyer-type">Buyer Type</Label>
            <Select value={buyerType} onValueChange={(v) => setBuyerType(v as BuyerType)}>
              <SelectTrigger id="buyer-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="first_time">First-Time Buyer</SelectItem>
                <SelectItem value="additional">Additional Property</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Affordability Results</CardTitle>
          <CardDescription>Based on a 4.5× income multiple — lenders may vary.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResultRow label="Max Borrowing (4.5× income)" value={gbp(maxBorrowing)} highlight />
          <ResultRow label="Max Property Price" value={gbp(maxPropertyPrice)} highlight />
          <ResultRow label="Estimated Monthly Payment" value={`${gbpExact(monthlyPayment)}/mo`} />
          <ResultRow label="Total Repayable" value={gbp(totalRepayable)} />
          <div className="mt-4 pt-4 border-t space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Upfront Costs</p>
            <ResultRow label="Stamp Duty (SDLT)" value={gbp(stampDuty)} />
            <ResultRow label="Estimated Legal Fees" value={gbp(legalFees)} />
            <ResultRow label="Survey Fee" value={gbp(surveyFee)} />
            <div className="flex items-center justify-between py-3 mt-1 bg-muted/50 rounded-md px-2">
              <span className="text-sm font-semibold">Total Cost to Buy</span>
              <span className="text-sm font-bold tabular-nums">{gbp(totalCostToBuy)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Mortgage Comparison
// ---------------------------------------------------------------------------

function MortgageComparison() {
  const [loanAmount, setLoanAmount] = useState(250000);
  const [compTerm, setCompTerm] = useState(25);

  const handleNumberInput = (
    setter: (v: number) => void,
    min = 1,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed >= min) setter(parsed);
  };

  // Calculate monthly payment for each product and sort ascending
  const productsWithPayments = MORTGAGE_PRODUCTS.map((p) => ({
    ...p,
    monthlyPayment: calculateMonthlyPayment(loanAmount, p.rate, compTerm),
  })).sort((a, b) => a.monthlyPayment - b.monthlyPayment);

  const cheapestPayment = productsWithPayments[0]?.monthlyPayment ?? 0;

  const rowKey = (p: MortgageProduct) => `${p.lender}-${p.product}`;

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
          <strong>Important:</strong> These rates are indicative only and not financial advice.
          Rates change daily — always get a personalised quote from a broker.
        </AlertDescription>
      </Alert>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparison Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loan-amount">Loan Amount (£)</Label>
              <Input
                id="loan-amount"
                type="number"
                min={1000}
                step={5000}
                value={loanAmount}
                onChange={handleNumberInput(setLoanAmount, 1000)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-term">Mortgage Term (years)</Label>
              <Input
                id="comp-term"
                type="number"
                min={1}
                max={40}
                step={1}
                value={compTerm}
                onChange={handleNumberInput(setCompTerm, 1)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Illustrative Mortgage Products</CardTitle>
          <CardDescription>
            Showing {productsWithPayments.length} products sorted by monthly payment (lowest first).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lender</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>LTV</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Initial Rate</TableHead>
                  <TableHead className="text-right">Monthly Payment</TableHead>
                  <TableHead className="text-right">APRC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithPayments.map((p) => {
                  const isCheapest = p.monthlyPayment === cheapestPayment;
                  return (
                    <TableRow
                      key={rowKey(p)}
                      className={
                        isCheapest
                          ? "bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900"
                          : undefined
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {p.lender}
                          {isCheapest && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                              Lowest
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{p.product}</TableCell>
                      <TableCell>{p.ltv}</TableCell>
                      <TableCell>
                        <Badge variant={p.type === "Tracker" ? "outline" : "secondary"}>
                          {p.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{p.rate.toFixed(2)}%</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {gbpExact(p.monthlyPayment)}/mo
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {p.aprc.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Monthly payments calculated using standard amortisation. APRC figures are illustrative.
        Not regulated financial advice. Always consult an FCA-authorised mortgage broker.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Rent Affordability Calculator (renter)
// ---------------------------------------------------------------------------

function RentAffordabilityCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState(2500);
  const [monthlyDebts, setMonthlyDebts] = useState(0);

  const netIncome = monthlyIncome - monthlyDebts;
  const maxRent = Math.max(0, Math.round(netIncome / 3));
  const comfortableRent = Math.max(0, Math.round(netIncome * 0.25));
  const stretchRent = Math.max(0, Math.round(netIncome * 0.35));

  const handleNumberInput = (
    setter: (v: number) => void,
    min = 0,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed >= min) setter(parsed);
    else if (e.target.value === "" || e.target.value === "-") setter(0);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Details</CardTitle>
          <CardDescription>Enter your monthly income and debts to estimate affordable rent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="monthly-income">Monthly Take-Home Income (£)</Label>
            <Input
              id="monthly-income"
              type="number"
              min={0}
              step={100}
              value={monthlyIncome}
              onChange={handleNumberInput(setMonthlyIncome)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly-debts">Existing Monthly Debts (£)</Label>
            <Input
              id="monthly-debts"
              type="number"
              min={0}
              step={50}
              value={monthlyDebts}
              onChange={handleNumberInput(setMonthlyDebts)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rent Affordability Results</CardTitle>
          <CardDescription>Based on standard affordability ratios after debts.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResultRow label="Comfortable Rent (25%)" value={gbp(comfortableRent)} />
          <ResultRow label="Recommended Max Rent (33%)" value={gbp(maxRent)} highlight />
          <ResultRow label="Stretch Rent (35%)" value={gbp(stretchRent)} />
          <div className="mt-4 pt-4 border-t">
            <ResultRow label="Net Monthly Income" value={gbp(netIncome)} />
            <ResultRow label="Remaining after Max Rent" value={gbp(netIncome - maxRent)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4: Deposit Budget Calculator (renter)
// ---------------------------------------------------------------------------

function DepositBudgetCalculator() {
  const [monthlySavings, setMonthlySavings] = useState(500);
  const [targetRent, setTargetRent] = useState(1200);

  // Security deposit = 5 weeks of rent (Tenant Fees Act 2019 cap)
  const weeklyRent = targetRent * 12 / 52;
  const securityDeposit = Math.round(weeklyRent * 5);
  const firstMonthRent = targetRent;
  const totalNeeded = securityDeposit + firstMonthRent;
  const monthsToSave = monthlySavings > 0 ? Math.ceil(totalNeeded / monthlySavings) : 0;

  const handleNumberInput = (
    setter: (v: number) => void,
    min = 0,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed) && parsed >= min) setter(parsed);
    else if (e.target.value === "" || e.target.value === "-") setter(0);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Savings Details</CardTitle>
          <CardDescription>Estimate how long it will take to save for your rental deposit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="monthly-savings">Monthly Savings (£)</Label>
            <Input
              id="monthly-savings"
              type="number"
              min={0}
              step={50}
              value={monthlySavings}
              onChange={handleNumberInput(setMonthlySavings)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-rent">Target Monthly Rent (£)</Label>
            <Input
              id="target-rent"
              type="number"
              min={0}
              step={50}
              value={targetRent}
              onChange={handleNumberInput(setTargetRent)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deposit Budget Breakdown</CardTitle>
          <CardDescription>Based on the Tenant Fees Act 2019 deposit cap (5 weeks&apos; rent).</CardDescription>
        </CardHeader>
        <CardContent>
          <ResultRow label="Security Deposit (5 weeks)" value={gbp(securityDeposit)} />
          <ResultRow label="First Month's Rent" value={gbp(firstMonthRent)} />
          <div className="flex items-center justify-between py-3 mt-1 bg-muted/50 rounded-md px-2">
            <span className="text-sm font-semibold">Total Needed</span>
            <span className="text-sm font-bold tabular-nums">{gbp(totalNeeded)}</span>
          </div>
          <div className="mt-4 pt-4 border-t">
            <ResultRow
              label="Months to Save"
              value={monthlySavings > 0 ? `${monthsToSave} month${monthsToSave !== 1 ? "s" : ""}` : "—"}
              highlight
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CalculatorsPage(
  props: Readonly<{ params: Promise<{ role: string }> }>,
) {
  const { role } = use(props.params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const isRenter = role === "renter";
  const defaultTab = isRenter ? "rent-affordability" : "affordability";
  const tab = searchParams.get("tab") ?? defaultTab;

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calculators</h1>
        <p className="text-muted-foreground mt-1">
          {isRenter
            ? "Estimate your rent affordability and plan your deposit budget."
            : "Estimate your affordability and compare indicative mortgage rates."}
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        {isRenter ? (
          <>
            <TabsList>
              <TabsTrigger value="rent-affordability">Rent Affordability</TabsTrigger>
              <TabsTrigger value="deposit-budget">Deposit Budget</TabsTrigger>
            </TabsList>

            <TabsContent value="rent-affordability">
              <RentAffordabilityCalculator />
            </TabsContent>

            <TabsContent value="deposit-budget">
              <DepositBudgetCalculator />
            </TabsContent>
          </>
        ) : (
          <>
            <TabsList>
              <TabsTrigger value="affordability">Affordability</TabsTrigger>
              <TabsTrigger value="mortgage-rates">Mortgage Rates</TabsTrigger>
            </TabsList>

            <TabsContent value="affordability">
              <AffordabilityCalculator />
            </TabsContent>

            <TabsContent value="mortgage-rates">
              <MortgageComparison />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
