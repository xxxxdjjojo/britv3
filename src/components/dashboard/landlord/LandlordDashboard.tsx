
/**
 * Landlord dashboard — Stitch "Portfolio Overview" design.
 * Stat ribbon is rendered by the parent role page; this content shows the
 * urgent compliance alerts, a deep-green Quick Management panel, the rent
 * collection table, and the recent maintenance requests list.
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
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import DashboardMessagesLink from "@/components/messaging/DashboardMessagesLink";
import {
  Flame,
  Zap,
  PoundSterling,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  Search,
  FileText,
  ArrowRight,
} from "lucide-react";
import type { LandlordDashboard as LandlordData } from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Mock data for visual rendering
// ---------------------------------------------------------------------------

const MOCK_COMPLIANCE_ALERTS = [
  {
    id: "1",
    icon: Flame,
    title: "Gas Safety Certificate",
    property: "22 Regency Square",
    message: "Expiring in 14 days",
    action: { label: "Renew Now", href: "/dashboard/landlord/compliance" },
    severity: "error" as const,
  },
  {
    id: "2",
    icon: Zap,
    title: "EICR Inspection",
    property: "104 High Street",
    message: "Expiring in 22 days",
    action: { label: "Schedule", href: "/dashboard/landlord/compliance" },
    severity: "warning" as const,
  },
];

const MOCK_QUICK_MANAGEMENT = [
  { id: "1", icon: Search, label: "Find Tradesperson", href: "/dashboard/landlord/maintenance" },
  { id: "2", icon: FileText, label: "Generate Report", href: "/dashboard/landlord/finance/expenses" },
];

const MOCK_RENT_COLLECTION = [
  {
    id: "1",
    property: "23 Regency Square",
    amount: 1850,
    dueDate: "01 Oct",
    status: "paid" as const,
  },
  {
    id: "2",
    property: "104 High Street, Flat 4",
    amount: 1200,
    dueDate: "05 Oct",
    status: "overdue" as const,
  },
  {
    id: "3",
    property: "The Old Rectory",
    amount: 2400,
    dueDate: "12 Oct",
    status: "due_soon" as const,
  },
  {
    id: "4",
    property: "Oak Lodge Cottage",
    amount: 1800,
    dueDate: "02 Oct",
    status: "paid" as const,
  },
];

const MOCK_RECENT_REQUESTS = [
  {
    id: "1",
    title: "Boiler Malfunction",
    property: "The Old Rectory — No hot water reported.",
    priority: "critical" as const,
    time: "1h ago",
  },
  {
    id: "2",
    title: "Leaking Tap in Kitchen",
    property: "104 High Street — Tenant reports slow drip.",
    priority: "leaking" as const,
    time: "4h ago",
  },
  {
    id: "3",
    title: "Gate Hinge Repair",
    property: "Oak Lodge — Front garden gate not closing properly.",
    priority: "low" as const,
    time: "1d ago",
  },
];

const RENT_STATUS_STYLES = {
  paid: { label: "Paid", className: "bg-success/10 text-success", icon: CheckCircle2 },
  overdue: { label: "Overdue", className: "bg-error/10 text-error", icon: AlertCircle },
  due_soon: { label: "Due Soon", className: "bg-warning/10 text-warning", icon: Clock },
};

const REQUEST_PRIORITY_STYLES = {
  critical: { label: "Critical", className: "bg-error/10 text-error" },
  leaking: { label: "Leaking", className: "bg-warning/10 text-warning" },
  low: { label: "Low", className: "bg-neutral-100 text-neutral-600" },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LandlordDashboard({ data }: Readonly<{ data: LandlordData }>) {
  return (
    <div className="flex flex-col gap-8">
      {/* ── 1. Urgent Compliance + Quick Management ─────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — Urgent Compliance (2/3) */}
        <section className="space-y-4 lg:col-span-2">
          <SectionHeader
            title="Urgent Compliance"
            action={{ label: "Check Compliance", href: "/dashboard/landlord/compliance" }}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {MOCK_COMPLIANCE_ALERTS.map((alert) => (
              <Card
                key={alert.id}
                className={`border-l-4 ${
                  alert.severity === "error"
                    ? "border-l-error bg-error/5"
                    : "border-l-warning bg-warning/5"
                }`}
              >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                        alert.severity === "error"
                          ? "bg-error/10 text-error"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      <alert.icon className="size-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900">
                        {alert.title}
                      </p>
                      <p className="text-xs text-neutral-500">{alert.property}</p>
                      <p className="mt-1 text-xs font-medium text-neutral-600">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant={alert.severity === "error" ? "destructive" : "outline"}
                    size="sm"
                    className="w-fit uppercase tracking-[0.06em]"
                    render={<Link href={alert.action.href} />}
                  >
                    {alert.action.label}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Right — Quick Management (1/3) */}
        <InsightPanel
          title="Quick Management"
          icon={Zap}
          className="lg:col-span-1"
        >
          <div className="mt-1 flex flex-col gap-2">
            {MOCK_QUICK_MANAGEMENT.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                <item.icon className="size-4 text-brand-gold" />
                {item.label}
              </Link>
            ))}
            <DashboardMessagesLink variant="panel" />
          </div>
        </InsightPanel>
      </div>

      {/* ── 2. Rent Collection Status ───────────────────────────────────── */}
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
                  <TableHead>Property Name</TableHead>
                  <TableHead className="text-right">Monthly Rent</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_RENT_COLLECTION.map((rent) => {
                  const statusStyle = RENT_STATUS_STYLES[rent.status];
                  return (
                    <TableRow key={rent.id}>
                      <TableCell className="font-medium text-neutral-900">
                        {rent.property}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        £{rent.amount.toLocaleString()}.00
                      </TableCell>
                      <TableCell className="text-neutral-500">{rent.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={`border-0 ${statusStyle.className}`}>
                          <statusStyle.icon className="mr-1 size-3" />
                          {statusStyle.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              variant="link"
              size="sm"
              render={<Link href="/dashboard/landlord/finance/expenses" />}
            >
              View All Finances
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Recent Requests ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-heading">
            <Wrench className="size-5 text-brand-primary" />
            Recent Requests
          </CardTitle>
          <Badge className="border-0 bg-error/10 text-error">3 Active</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {MOCK_RECENT_REQUESTS.map((item) => {
            const priorityStyle = REQUEST_PRIORITY_STYLES[item.priority];
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border p-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`border-0 ${priorityStyle.className}`}>
                      {priorityStyle.label}
                    </Badge>
                    <p className="text-sm font-semibold text-neutral-900">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-500">{item.property}</p>
                </div>
                <span className="shrink-0 text-xs text-neutral-500">{item.time}</span>
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button
              variant="link"
              size="sm"
              render={<Link href="/dashboard/landlord/maintenance" />}
            >
              View All Tasks
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
