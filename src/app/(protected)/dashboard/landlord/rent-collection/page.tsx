"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PoundSterling,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Wallet,
  BellRing,
  Search,
  Download,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

type PaymentStatus = "paid" | "due" | "overdue";

type TenantRow = {
  property: string;
  tenant: string;
  months: PaymentStatus[];
  annualCollected: number;
  annualExpected: number;
};

const tenants: TenantRow[] = [
  {
    property: "124 Oakwood Dr",
    tenant: "James Miller",
    months: ["paid", "paid", "paid", "paid", "paid"],
    annualCollected: 14400,
    annualExpected: 14400,
  },
  {
    property: "Harbor View Apt 4B",
    tenant: "Sarah Chen",
    months: ["paid", "paid", "paid", "paid", "overdue"],
    annualCollected: 18200,
    annualExpected: 21000,
  },
  {
    property: "99 Sunset Blvd",
    tenant: "Marcus Wright",
    months: ["paid", "paid", "paid", "paid", "due"],
    annualCollected: 12000,
    annualExpected: 15000,
  },
  {
    property: "22B Sky Loft",
    tenant: "Elena Gomez",
    months: ["paid", "paid", "paid", "paid", "paid"],
    annualCollected: 32000,
    annualExpected: 32000,
  },
];

const monthLabels = ["Jun", "Jul", "Aug", "Sep", "Oct"];

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-success-light text-xs font-semibold text-success">
        P
      </span>
    );
  }
  if (status === "due") {
    return (
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-warning-light text-xs font-semibold text-warning">
        D
      </span>
    );
  }
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-full bg-error-light text-xs font-semibold text-error">
      O
    </span>
  );
}

function formatCurrency(amount: number) {
  return `\u00A3${amount.toLocaleString("en-GB")}`;
}

export default function RentCollectionPage() {
  const [smsReminders, setSmsReminders] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [gracePeriod, setGracePeriod] = useState("3");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Rent Collection &amp; Tracking
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage rental income
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
          <Button size="sm">
            <PlusCircle className="mr-2 size-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Expected</p>
              <Wallet className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">{formatCurrency(42500)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <TrendingUp className="size-4 text-brand-primary" />
            </div>
            <CardTitle className="text-3xl text-brand-primary">
              {formatCurrency(34200)}
            </CardTitle>
            <p className="text-xs text-muted-foreground">80.4% collected</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Due Soon</p>
              <Clock className="size-4 text-warning" />
            </div>
            <CardTitle className="text-3xl text-warning">
              {formatCurrency(6800)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Overdue</p>
              <AlertTriangle className="size-4 text-error" />
            </div>
            <CardTitle className="text-3xl text-error">
              {formatCurrency(1500)}
            </CardTitle>
            <p className="text-xs text-error">3 tenants overdue</p>
          </CardHeader>
        </Card>
      </div>

      {/* Two-column: Chart + Reminders */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income Chart Placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Income Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
              <div className="text-center">
                <PoundSterling className="mx-auto mb-2 size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Income chart coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automated Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellRing className="size-5 text-brand-primary" />
              <CardTitle className="font-heading text-lg">Automated Reminders</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-toggle" className="text-sm font-medium">
                SMS Reminders
              </Label>
              <Switch
                id="sms-toggle"
                checked={smsReminders}
                onCheckedChange={setSmsReminders}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-toggle" className="text-sm font-medium">
                Email Overdue Alerts
              </Label>
              <Switch
                id="email-toggle"
                checked={emailAlerts}
                onCheckedChange={setEmailAlerts}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grace-period" className="text-sm font-medium">
                Grace Period (days)
              </Label>
              <Input
                id="grace-period"
                type="number"
                min="0"
                max="30"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline" size="sm" className="w-full">
              View Email Templates
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Rent Matrix Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg">Rent Matrix</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search tenants..." className="pl-9 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="sticky left-0 z-10 min-w-[220px] bg-muted/50">
                    Property &amp; Tenant
                  </TableHead>
                  {monthLabels.map((month, i) => (
                    <TableHead key={month} className="text-center">
                      {month}
                      {i === monthLabels.length - 1 && (
                        <Badge className="ml-1 border-0 bg-brand-primary-lighter text-brand-primary text-[10px] px-1.5 py-0">
                          Current
                        </Badge>
                      )}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Annual Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant, i) => {
                  const isShort = tenant.annualCollected < tenant.annualExpected;
                  return (
                    <TableRow key={i}>
                      <TableCell className="sticky left-0 z-10 bg-background">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Building2 className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{tenant.property}</p>
                            <p className="text-xs text-muted-foreground">{tenant.tenant}</p>
                          </div>
                        </div>
                      </TableCell>
                      {tenant.months.map((status, j) => (
                        <TableCell key={j} className="text-center">
                          <StatusBadge status={status} />
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <span className={isShort ? "text-error font-medium" : "font-medium"}>
                          {formatCurrency(tenant.annualCollected)}
                        </span>
                        <span className="text-muted-foreground">
                          /{formatCurrency(tenant.annualExpected)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 4 of 28 Properties
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-brand-primary text-white hover:bg-brand-primary-light">
            1
          </Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
