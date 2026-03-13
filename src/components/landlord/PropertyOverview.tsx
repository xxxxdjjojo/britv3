"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MapPin,
  Pencil,
  Share2,
  Plus,
  Bed,
  Bath,
  Ruler,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";

// --- Types ---

type PropertyData = Readonly<{
  id: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  active_tenancy: {
    id: string;
    tenant_name: string;
    tenant_email: string | null;
    status: string;
    lease_start_date: string;
    lease_end_date: string | null;
    rent_amount: number;
    rent_frequency: string;
  } | null;
  open_maintenance_count: number;
  expiring_documents_count: number;
  total_tenancies: number;
}>;

// --- Mock supplementary data (Stitch design enrichment) ---

const rentHistory = [
  { month: "JAN", paid: 2400, expected: 2400 },
  { month: "FEB", paid: 2400, expected: 2400 },
  { month: "MAR", paid: 2400, expected: 2400 },
  { month: "APR", paid: 2400, expected: 2400 },
  { month: "MAY", paid: 2400, expected: 2400 },
  { month: "JUN", paid: 0, expected: 2400 },
  { month: "JUL", paid: 2400, expected: 2400 },
  { month: "AUG", paid: 2400, expected: 2400 },
  { month: "SEP", paid: 2400, expected: 2400 },
  { month: "OCT", paid: 2400, expected: 2400 },
  { month: "NOV", paid: 2400, expected: 2400 },
  { month: "DEC", paid: 2400, expected: 2400 },
];

const complianceCerts = [
  { name: "Gas Safety", status: "valid", statusLabel: "Valid", color: "text-success", bg: "bg-success-light" },
  { name: "EICR", status: "valid", statusLabel: "Valid", color: "text-success", bg: "bg-success-light" },
  { name: "Smoke Alarms", status: "due", statusLabel: "Due Soon", color: "text-warning", bg: "bg-warning-light" },
];

const propertySpecs = [
  { label: "Bedrooms", value: "3", icon: Bed },
  { label: "Bathrooms", value: "2.5", icon: Bath },
  { label: "Area", value: "1,450 sqft", icon: Ruler },
  { label: "EPC Rating", value: "Grade A", icon: Zap },
];

export default function PropertyOverview({ property }: Readonly<{ property: PropertyData }>) {
  const address = [property.address_line_1, property.address_line_2]
    .filter(Boolean)
    .join(", ");
  const fullAddress = `${address}, ${property.city}, ${property.postcode}`;

  const maxRent = Math.max(...rentHistory.map((r) => r.expected));

  return (
    <div className="space-y-6">
      {/* Property Hero Header */}
      <Card className="overflow-hidden">
        {/* Image placeholder */}
        <div className="relative h-48 bg-muted">
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span className="text-sm">Property Image</span>
          </div>
          <Badge className="absolute left-4 top-4 bg-success text-white">
            Occupied
          </Badge>
        </div>

        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">{address}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" />
                {fullAddress}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="size-4" />
                Share
              </Button>
              <Button size="sm">
                <Plus className="size-4" />
                Log Payment
              </Button>
            </div>
          </div>

          {/* Spec Grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {propertySpecs.map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.label}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter">
                    <Icon className="size-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{spec.label}</p>
                    <p className="text-sm font-semibold">{spec.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tab Bar */}
      <Tabs defaultValue="overview">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tenancy">Tenancy</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* LEFT COLUMN (2/3) */}
            <div className="space-y-6 lg:col-span-2">
              {/* Rent Collection History */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Rent Collection History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 pb-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-3 rounded-sm bg-brand-primary" />
                      Paid
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block size-3 rounded-sm bg-muted" />
                      Expected
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    {rentHistory.map((month) => (
                      <div key={month.month} className="flex flex-1 flex-col items-center gap-1.5">
                        <div className="relative w-full" style={{ height: 120 }}>
                          {/* Expected bar (background) */}
                          <div
                            className="absolute bottom-0 w-full rounded-t-sm bg-muted"
                            style={{ height: `${(month.expected / maxRent) * 100}%` }}
                          />
                          {/* Paid bar (foreground) */}
                          {month.paid > 0 && (
                            <div
                              className="absolute bottom-0 w-full rounded-t-sm bg-brand-primary"
                              style={{ height: `${(month.paid / maxRent) * 100}%` }}
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{month.month}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Two-column grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Compliance Certificates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-base">
                      Compliance Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {complianceCerts.map((cert) => (
                      <div
                        key={cert.name}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <span className="text-sm font-medium">{cert.name}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cert.bg} ${cert.color}`}
                        >
                          {cert.status === "valid" ? (
                            <CheckCircle2 className="size-3" />
                          ) : (
                            <AlertTriangle className="size-3" />
                          )}
                          {cert.statusLabel}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Open Maintenance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-base">
                      Open Maintenance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                        <Wrench className="size-5 text-muted-foreground" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        No active maintenance tickets
                      </p>
                      <Button variant="outline" size="sm" className="mt-4">
                        <Plus className="size-4" />
                        Log New Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* RIGHT COLUMN (1/3) */}
            <div className="space-y-6">
              {/* Current Tenant */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-base">Current Tenant</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">
                      SJ
                    </div>
                    <div>
                      <p className="font-medium">
                        {property.active_tenancy?.tenant_name ?? "Sarah Jenkins"}
                      </p>
                      <p className="text-xs text-muted-foreground">Since Jan 2022</p>
                    </div>
                  </div>
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Rent</span>
                      <span className="font-medium">£2,400</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Lease</span>
                      <span className="font-medium">12 Months Fixed</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Renewal</span>
                      <span className="font-medium">15 Jan 2024</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Deposit</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">£3,600</span>
                        <Badge variant="secondary" className="text-[10px]">Protected</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Mail className="size-4" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Phone className="size-4" />
                      Call
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Yield Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-base">Yield Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Circular yield indicator */}
                  <div className="flex items-center justify-center py-4">
                    <div className="relative flex size-32 items-center justify-center">
                      <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          className="text-muted"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="52"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={`${(5.8 / 10) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                          strokeLinecap="round"
                          className="text-brand-primary"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold">5.8%</span>
                        <span className="text-xs text-muted-foreground">Net Yield</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 border-t pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Annual Gross Income</span>
                      <span className="font-medium">£28,800</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expenses</span>
                      <span className="font-medium text-error">-£4,200</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Net Annual Cashflow</span>
                      <span className="font-bold text-brand-primary">£24,600</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-base">Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-40 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="size-6 text-muted-foreground" />
                  </div>
                  <button className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-medium text-brand-primary hover:underline">
                    View Local Market Insights
                    <ArrowRight className="size-4" />
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Placeholder content for other tabs */}
        <TabsContent value="tenancy" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Tenancy details coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="financial" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Financial details coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="compliance" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Compliance details coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="maintenance" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Maintenance details coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Documents coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
