"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  PoundSterling,
  Wallet,
  Download,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  FileText,
  Building2,
} from "lucide-react";

// --- Mock data ---

const keyMetrics = [
  {
    label: "Total Revenue",
    value: "£142,500",
    change: "+8.4%",
    changeColor: "text-success",
    icon: TrendingUp,
    iconBg: "bg-brand-primary-lighter",
    iconColor: "text-brand-primary",
    cardClass: "",
    textClass: "",
  },
  {
    label: "Total Expenses",
    value: "£48,230.15",
    change: "+12.1%",
    changeColor: "text-warning",
    icon: PoundSterling,
    iconBg: "bg-warning-light",
    iconColor: "text-warning",
    cardClass: "",
    textClass: "",
  },
  {
    label: "Net Profit",
    value: "£94,269.85",
    change: "66.1% Margin",
    changeColor: "",
    icon: Wallet,
    iconBg: "bg-white/20",
    iconColor: "text-white",
    cardClass: "bg-brand-primary text-white",
    textClass: "text-white",
    isBadge: true,
  },
];

const propertyBars = [
  { name: "Canary Wharf Apt", value: 3200, max: 3500 },
  { name: "Shoreditch Loft", value: 2800, max: 3500 },
  { name: "Paddington Sq", value: 2400, max: 3500 },
  { name: "Kensington Rd", value: 1900, max: 3500 },
  { name: "Chelsea Mews", value: 1600, max: 3500 },
];

const expenseCategories = [
  { name: "Mortgage Interests", amount: "£28,400", percent: 58, color: "bg-brand-primary" },
  { name: "Maintenance & Repairs", amount: "£12,150", percent: 25, color: "bg-warning" },
  { name: "Insurance Premiums", amount: "£5,200", percent: 12, color: "bg-info" },
  { name: "Other Fees", amount: "£2,480", percent: 5, color: "bg-neutral-400" },
];

const transactions = [
  {
    date: "08 Mar 2026",
    property: "Canary Wharf Apt",
    category: "Maintenance",
    categoryColor: "bg-warning-light text-warning",
    description: "Emergency plumbing repair",
    amount: "£1,240.00",
    status: "paid",
  },
  {
    date: "05 Mar 2026",
    property: "Shoreditch Loft",
    category: "Mortgage",
    categoryColor: "bg-brand-primary-lighter text-brand-primary",
    description: "Monthly mortgage payment",
    amount: "£2,150.00",
    status: "paid",
  },
  {
    date: "03 Mar 2026",
    property: "Paddington Sq",
    category: "Insurance",
    categoryColor: "bg-info-light text-info",
    description: "Buildings & contents insurance",
    amount: "£485.00",
    status: "paid",
  },
  {
    date: "01 Mar 2026",
    property: "Kensington Rd",
    category: "Legal",
    categoryColor: "bg-neutral-100 text-neutral-600",
    description: "Lease renewal solicitor fees",
    amount: "£850.00",
    status: "pending",
  },
  {
    date: "28 Feb 2026",
    property: "Chelsea Mews",
    category: "Maintenance",
    categoryColor: "bg-warning-light text-warning",
    description: "Annual boiler service",
    amount: "£195.00",
    status: "paid",
  },
];

export default function FinancesPage() {
  const [chartMode, setChartMode] = useState<"monthly" | "annually">("monthly");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/landlord">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Financials</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Portfolio Financials &amp; Analytics
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <RefreshCw className="size-3.5" />
            Last synced: Today, 09:42 AM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="2025-26">
            <SelectTrigger className="w-[160px]">
              <Calendar className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-26">2025/26 Tax Year</SelectItem>
              <SelectItem value="2024-25">2024/25 Tax Year</SelectItem>
              <SelectItem value="2023-24">2023/24 Tax Year</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="size-4" />
            Export for Self-Assessment
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {keyMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className={metric.cardClass}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${metric.iconBg}`}>
                  <Icon className={`size-6 ${metric.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${metric.textClass || "text-muted-foreground"}`}>
                    {metric.label}
                  </p>
                  <p className={`text-2xl font-bold tracking-tight ${metric.textClass}`}>
                    {metric.value}
                  </p>
                  {metric.isBadge ? (
                    <Badge className="mt-1 border-white/30 bg-white/20 text-white">
                      {metric.change}
                    </Badge>
                  ) : (
                    <p className={`mt-1 text-sm font-medium ${metric.changeColor}`}>
                      {metric.change}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Visualization Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income by Property (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-heading">Income by Property</CardTitle>
            <div className="flex gap-1 rounded-lg bg-muted p-0.5">
              <button
                onClick={() => setChartMode("monthly")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  chartMode === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartMode("annually")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  chartMode === "annually"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annually
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 pt-2">
              {propertyBars.map((bar) => (
                <div key={bar.name} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    £{(chartMode === "annually" ? bar.value * 12 : bar.value).toLocaleString()}
                  </span>
                  <div className="relative w-full" style={{ height: 180 }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-md bg-brand-primary/40 transition-all hover:bg-brand-primary"
                      style={{
                        height: `${(bar.value / bar.max) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="max-w-[80px] truncate text-center text-xs text-muted-foreground">
                    {bar.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Distribution (1/3) */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {expenseCategories.map((cat) => (
              <div key={cat.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">{cat.amount}</span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${cat.color} transition-all`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{cat.percent}%</p>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View Category Breakdown
              <ChevronRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Expense Tracker */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-heading">Detailed Expense Tracker</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Search className="size-4" />
              Search
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="size-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      {tx.property}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tx.categoryColor}`}>
                      {tx.category}
                    </span>
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-right font-medium">{tx.amount}</TableCell>
                  <TableCell>
                    {tx.status === "paid" ? (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="size-4" />
                        <span className="text-sm">Paid</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing 1 to 5 of 42 transactions
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Self-Assessment Banner */}
      <Card className="relative overflow-hidden bg-neutral-950 text-white">
        {/* Decorative gradient blurs */}
        <div className="pointer-events-none absolute -left-20 -top-20 size-60 rounded-full bg-brand-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 size-60 rounded-full bg-brand-secondary/20 blur-3xl" />
        <CardContent className="relative flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <h3 className="font-heading text-xl font-bold">Ready for Self-Assessment?</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Download your HMRC-compliant financial summary or export a complete CSV ledger
              of all property income and expenses for the selected tax year.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <FileText className="size-4" />
              Download PDF Summary
            </Button>
            <Button className="bg-brand-primary-light hover:bg-brand-primary">
              <Download className="size-4" />
              Export CSV Ledger
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
