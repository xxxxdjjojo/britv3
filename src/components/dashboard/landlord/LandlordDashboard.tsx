"use client";

/**
 * Landlord dashboard content.
 * Shows stats ribbon, compliance alerts, rent collection, quick actions,
 * and maintenance feed — matching the Stitch landlord-dashboard design.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  Users,
  PoundSterling,
  AlertTriangle,
  ShieldAlert,
  FileText,
  Zap,
  Building2,
  ClipboardCheck,
  Wrench,
  User,
  Calendar,
  CheckCircle2,
  Bell,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { LandlordDashboard as LandlordData } from "@/types/dashboard";

// Mock data for visual rendering when real data is empty
const MOCK_COMPLIANCE_ALERTS = [
  {
    id: "1",
    type: "gas" as const,
    title: "Gas Safety Certificate",
    property: "Flat 12, Victoria Court",
    message: "Expires in 5 days — schedule inspection now",
    severity: "warning" as const,
  },
  {
    id: "2",
    type: "epc" as const,
    title: "EPC Certificate Overdue",
    property: "88 Kensington High St",
    message: "Expired 30 days ago — renewal required",
    severity: "error" as const,
  },
];

const MOCK_RENT_COLLECTION = [
  {
    id: "1",
    tenant: "Alex Thompson",
    property: "24 Oakwood Crescent",
    amount: 1450,
    status: "paid" as const,
    dueDate: "1 Mar 2026",
  },
  {
    id: "2",
    tenant: "Sarah Jenkins",
    property: "12 Silver Street",
    amount: 2100,
    status: "pending" as const,
    dueDate: "1 Mar 2026",
  },
  {
    id: "3",
    tenant: "Marcus Webb",
    property: "44 River View",
    amount: 1200,
    status: "paid" as const,
    dueDate: "1 Mar 2026",
  },
];

const MOCK_MAINTENANCE = [
  {
    id: "1",
    title: "Leaking Tap",
    property: "24 Oakwood Crescent",
    status: "in_progress" as const,
    date: "5 Mar 2026",
  },
  {
    id: "2",
    title: "Boiler Service",
    property: "12 Silver Street",
    status: "scheduled" as const,
    date: "10 Mar 2026",
  },
  {
    id: "3",
    title: "Lock Replacement",
    property: "44 River View",
    status: "completed" as const,
    date: "28 Feb 2026",
  },
];

const MAINTENANCE_STATUS_STYLES = {
  in_progress: { label: "In Progress", className: "bg-brand-accent/10 text-brand-accent" },
  scheduled: { label: "Scheduled", className: "bg-warning-light text-warning" },
  completed: { label: "Completed", className: "bg-success-light text-success" },
};

export function LandlordDashboard({ data }: Readonly<{ data: LandlordData }>) {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Properties */}
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
              <Home className="size-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Properties</p>
              <p className="text-2xl font-semibold font-heading">
                {data.portfolio_count || 5}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy */}
        <Card>
          <CardContent className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
                <Users className="size-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupancy</p>
                <p className="text-2xl font-semibold font-heading">
                  4<span className="text-sm font-normal text-muted-foreground"> / 1 Vacant</span>
                </p>
              </div>
            </div>
            <Progress value={80}>
              <span className="sr-only">80% occupied</span>
            </Progress>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
              <PoundSterling className="size-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold font-heading">
                  £{(data.total_income || 7250).toLocaleString()}
                </p>
                <span className="flex items-center text-xs text-success">
                  <TrendingUp className="mr-0.5 size-3" />
                  +4.2%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Issues */}
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-error-light">
              <AlertTriangle className="size-5 text-error" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Compliance Issues</p>
              <p className="text-2xl font-semibold font-heading text-error">2</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: 8col left, 4col right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Compliance Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <ShieldAlert className="size-5 text-error" />
                Compliance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {MOCK_COMPLIANCE_ALERTS.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-4 rounded-lg border p-4 ${
                    alert.severity === "error"
                      ? "border-error/30 bg-error-light"
                      : "border-warning/30 bg-warning-light"
                  }`}
                >
                  <div className="mt-0.5">
                    {alert.severity === "error" ? (
                      <FileText className="size-5 text-error" />
                    ) : (
                      <AlertTriangle className="size-5 text-warning" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.property}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.message}</p>
                  </div>
                  <Button
                    variant={alert.severity === "error" ? "destructive" : "outline"}
                    size="sm"
                    render={<Link href="/dashboard/landlord/compliance" />}
                  >
                    {alert.severity === "error" ? "Renew Now" : "Schedule"}
                  </Button>
                </div>
              ))}
              <div className="flex justify-end">
                <Button
                  variant="link"
                  size="sm"
                  render={<Link href="/dashboard/landlord/compliance" />}
                >
                  View All Compliance
                  <ArrowRight className="ml-1 size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rent Collection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <PoundSterling className="size-5 text-brand-primary" />
                Rent Collection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_RENT_COLLECTION.map((rent) => (
                      <TableRow key={rent.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="size-4 text-muted-foreground" />
                            {rent.tenant}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground">
                          {rent.property}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          £{rent.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {rent.dueDate}
                          </div>
                        </TableCell>
                        <TableCell>
                          {rent.status === "paid" ? (
                            <Badge className="bg-success-light text-success border-0">
                              <CheckCircle2 className="mr-1 size-3" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-warning-light text-warning border-0">
                              <Bell className="mr-1 size-3" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  variant="link"
                  size="sm"
                  render={<Link href="/dashboard/landlord/finances" />}
                >
                  View All Finances
                  <ArrowRight className="ml-1 size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Zap className="size-5 text-brand-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full justify-start gap-2"
                render={<Link href="/dashboard/landlord/portfolio" />}
              >
                <Building2 className="size-4" />
                Add Property
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start gap-2"
                render={<Link href="/dashboard/landlord/compliance" />}
              >
                <ClipboardCheck className="size-4" />
                Check Compliance
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-start gap-2"
                render={<Link href="/dashboard/landlord/maintenance" />}
              >
                <Wrench className="size-4" />
                Find Tradesperson
              </Button>
            </CardContent>
          </Card>

          {/* Maintenance Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <Wrench className="size-5 text-brand-primary" />
                Maintenance Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {MOCK_MAINTENANCE.map((item) => {
                const statusStyle = MAINTENANCE_STATUS_STYLES[item.status];
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="mt-0.5">
                      <Wrench className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.property}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={`border-0 ${statusStyle.className}`}>
                          {statusStyle.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          <Calendar className="mr-1 inline size-3" />
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex justify-end">
                <Button
                  variant="link"
                  size="sm"
                  render={<Link href="/dashboard/landlord/maintenance" />}
                >
                  View All Maintenance
                  <ArrowRight className="ml-1 size-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
