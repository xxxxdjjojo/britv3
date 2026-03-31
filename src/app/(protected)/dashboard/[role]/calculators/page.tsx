"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestmentCalculator } from "@/components/calculators/InvestmentCalculator";
import { LtvCalculator } from "@/components/calculators/LtvCalculator";
import { MovingCostCalculator } from "@/components/calculators/MovingCostCalculator";
import { OverpaymentCalculator } from "@/components/calculators/OverpaymentCalculator";
import { EquityCalculator } from "@/components/calculators/EquityCalculator";
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
import {
  Calculator,
  TrendingUp,
  BarChart3,
  Layers,
  Truck,
  RefreshCcw,
  Home,
} from "lucide-react";

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
    <div
      className={`flex items-center justify-between py-3 border-b last:border-b-0 ${
        highlight ? "text-brand-primary dark:text-brand-primary font-semibold" : ""
      }`}
    >
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
      <Card className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="h-4 w-4 text-brand-primary" strokeWidth={1.5} />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Your Details</span>
          </div>
          <CardDescription>Enter your income and purchase details to estimate affordability.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="annual-income" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Annual Income (£)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">£</span>
              <Input
                id="annual-income"
                type="number"
                min={0}
                step={1000}
                value={annualIncome}
                onChange={handleNumberInput(setAnnualIncome)}
                className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partner-income" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Partner Income (£) — optional
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">£</span>
              <Input
                id="partner-income"
                type="number"
                min={0}
                step={1000}
                value={partnerIncome}
                onChange={handleNumberInput(setPartnerIncome)}
                className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deposit" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Deposit (£)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">£</span>
              <Input
                id="deposit"
                type="number"
                min={0}
                step={1000}
                value={deposit}
                onChange={handleNumberInput(setDeposit)}
                className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Mortgage Term</Label>
              <span className="text-sm font-bold text-brand-primary">{term} years</span>
            </div>
            <Slider
              min={5}
              max={40}
              step={1}
              value={[term]}
              onValueChange={(vals) => setTerm((vals as number[])[0] ?? term)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>5 yrs</span>
              <span>40 yrs</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interest Rate</Label>
              <span className="text-sm font-bold text-brand-primary">{rate.toFixed(1)}%</span>
            </div>
            <Slider
              min={0.1}
              max={15}
              step={0.1}
              value={[rate]}
              onValueChange={(vals) => setRate((vals as number[])[0] ?? rate)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-400">
              <span>0.1%</span>
              <span>15%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buyer-type" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Buyer Type
            </Label>
            <Select value={buyerType} onValueChange={(v) => setBuyerType(v as BuyerType)}>
              <SelectTrigger id="buyer-type" className="rounded-xl border-neutral-200 dark:border-neutral-700">
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
      <div className="space-y-5">
        {/* Hero result card */}
        <div className="relative overflow-hidden rounded-2xl bg-brand-primary p-8 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />

          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-white/60">
            Maximum Borrowing
          </p>
          <div className="mb-2">
            <span className="font-heading text-5xl font-black leading-none tracking-tight text-white">
              {gbp(maxBorrowing)}
            </span>
          </div>
          <p className="text-sm text-white/70 mb-6">Based on 4.5× income multiple</p>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                Max Property Price
              </p>
              <p className="text-lg font-bold text-white">{gbp(maxPropertyPrice)}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/50">
                Monthly Payment
              </p>
              <p className="text-lg font-bold text-white">{gbpExact(monthlyPayment)}/mo</p>
            </div>
          </div>
        </div>

        {/* Breakdown card */}
        <Card className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-400">
              Full Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResultRow label="Total Repayable" value={gbp(totalRepayable)} />
            <div className="mt-4 pt-4 border-t space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-3">Upfront Costs</p>
              <ResultRow label="Stamp Duty (SDLT)" value={gbp(stampDuty)} />
              <ResultRow label="Estimated Legal Fees" value={gbp(legalFees)} />
              <ResultRow label="Survey Fee" value={gbp(surveyFee)} />
              <div className="flex items-center justify-between py-3 mt-2 rounded-xl bg-brand-primary/5 px-4 border border-brand-primary/10">
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">Total Cost to Buy</span>
                <span className="text-sm font-bold tabular-nums text-brand-primary">{gbp(totalCostToBuy)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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

  const productsWithPayments = MORTGAGE_PRODUCTS.map((p) => ({
    ...p,
    monthlyPayment: calculateMonthlyPayment(loanAmount, p.rate, compTerm),
  })).sort((a, b) => a.monthlyPayment - b.monthlyPayment);

  const cheapestPayment = productsWithPayments[0]?.monthlyPayment ?? 0;
  const top3 = productsWithPayments.slice(0, 3);
  const rest = productsWithPayments.slice(3);

  const rowKey = (p: MortgageProduct) => `${p.lender}-${p.product}`;

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <Alert className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800">
        <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
          <strong>Important:</strong> These rates are indicative only and not financial advice.
          Rates change daily — always get a personalised quote from a broker.
        </AlertDescription>
      </Alert>

      {/* Inputs */}
      <Card className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-primary" strokeWidth={1.5} />
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Comparison Parameters</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loan-amount" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Loan Amount (£)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-400">£</span>
                <Input
                  id="loan-amount"
                  type="number"
                  min={1000}
                  step={5000}
                  value={loanAmount}
                  onChange={handleNumberInput(setLoanAmount, 1000)}
                  className="pl-8 rounded-xl border-neutral-200 dark:border-neutral-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comp-term" className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Mortgage Term (years)
              </Label>
              <Input
                id="comp-term"
                type="number"
                min={1}
                max={40}
                step={1}
                value={compTerm}
                onChange={handleNumberInput(setCompTerm, 1)}
                className="rounded-xl border-neutral-200 dark:border-neutral-700"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured top 3 product cards */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">
          Top Picks — Lowest Monthly Payment
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {top3.map((p, idx) => {
            const isBest = idx === 0;
            return (
              <div
                key={rowKey(p)}
                className={`relative rounded-2xl p-6 transition-all ${
                  isBest
                    ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-[1.02]"
                    : "bg-white border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 shadow-sm"
                }`}
              >
                {isBest && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-secondary px-3 py-0.5 text-[11px] font-bold text-white shadow">
                    Lowest Rate
                  </span>
                )}
                <p className={`mb-0.5 text-xs font-bold uppercase tracking-widest ${isBest ? "text-white/60" : "text-neutral-400"}`}>
                  {p.lender}
                </p>
                <p className={`mb-3 text-sm font-semibold ${isBest ? "text-white/90" : "text-neutral-700 dark:text-neutral-300"}`}>
                  {p.product} · {p.ltv} LTV
                </p>
                <p className={`font-heading text-3xl font-black leading-none ${isBest ? "text-white" : "text-neutral-900 dark:text-white"}`}>
                  {gbpExact(p.monthlyPayment)}<span className="text-sm font-normal">/mo</span>
                </p>
                <div className={`mt-4 pt-4 border-t ${isBest ? "border-white/10" : "border-neutral-100 dark:border-neutral-800"} grid grid-cols-2 gap-2`}>
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${isBest ? "text-white/50" : "text-neutral-400"}`}>Initial Rate</p>
                    <p className={`text-sm font-bold tabular-nums ${isBest ? "text-white" : "text-neutral-900 dark:text-white"}`}>{p.rate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${isBest ? "text-white/50" : "text-neutral-400"}`}>APRC</p>
                    <p className={`text-sm font-bold tabular-nums ${isBest ? "text-white" : "text-neutral-900 dark:text-white"}`}>{p.aprc.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Remaining products in a table */}
      {rest.length > 0 && (
        <Card className="rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-neutral-400">
              All Products ({productsWithPayments.length} total)
            </CardTitle>
            <CardDescription>Sorted by monthly payment — lowest first.</CardDescription>
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
                            ? "bg-brand-primary/5 hover:bg-brand-primary/10 dark:bg-brand-primary/10"
                            : undefined
                        }
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {p.lender}
                            {isCheapest && (
                              <Badge variant="secondary" className="bg-brand-primary/10 text-brand-primary text-xs border-0">
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
      )}

      <p className="text-xs text-muted-foreground text-center">
        Monthly payments calculated using standard amortisation. APRC figures are illustrative.
        Not regulated financial advice. Always consult an FCA-authorised mortgage broker.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const TAB_ITEMS = [
  { value: "affordability", label: "Affordability", icon: Calculator },
  { value: "mortgage-rates", label: "Mortgage Rates", icon: BarChart3 },
  { value: "investment", label: "Investment Yield", icon: TrendingUp },
  { value: "ltv", label: "LTV", icon: Layers },
  { value: "moving-cost", label: "Moving Costs", icon: Truck },
  { value: "overpayment", label: "Overpayment", icon: RefreshCcw },
  { value: "equity", label: "Equity", icon: Home },
] as const;

export default function CalculatorsPage() {
  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Calculators
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Estimate affordability, compare rates, analyse investment yields, calculate LTV, and more.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="affordability" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-neutral-100 dark:bg-neutral-800/60 p-1 rounded-xl">
          {TAB_ITEMS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="affordability">
          <AffordabilityCalculator />
        </TabsContent>

        <TabsContent value="mortgage-rates">
          <MortgageComparison />
        </TabsContent>

        <TabsContent value="investment">
          <InvestmentCalculator />
        </TabsContent>

        <TabsContent value="ltv">
          <LtvCalculator />
        </TabsContent>

        <TabsContent value="moving-cost">
          <MovingCostCalculator />
        </TabsContent>

        <TabsContent value="overpayment">
          <OverpaymentCalculator />
        </TabsContent>

        <TabsContent value="equity">
          <EquityCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
