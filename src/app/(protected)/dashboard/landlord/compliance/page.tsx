"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Download,
  CalendarPlus,
  MoreVertical,
  Building2,
  ClipboardCheck,
  BadgeCheck,
  Zap,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type CertStatus = "valid" | "expiring" | "expired";

type CertificateCell = {
  status: CertStatus;
  detail: string;
};

type PropertyRow = {
  address: string;
  region: string;
  gasSafety: CertificateCell;
  epc: CertificateCell;
  eicr: CertificateCell;
  pat: CertificateCell;
  legionella: CertificateCell;
  fireAlarm: CertificateCell;
};

const properties: PropertyRow[] = [
  {
    address: "22 Baker Street, London NW1",
    region: "London",
    gasSafety: { status: "valid", detail: "Valid until 14 Sep 2026" },
    epc: { status: "valid", detail: "Grade B — Valid until 2031" },
    eicr: { status: "expiring", detail: "Expiring in 28 days" },
    pat: { status: "valid", detail: "Valid until 20 Nov 2026" },
    legionella: { status: "valid", detail: "Valid until 08 Mar 2027" },
    fireAlarm: { status: "valid", detail: "Valid until 01 Jun 2026" },
  },
  {
    address: "45 King Henry's Road, Manchester M3",
    region: "Manchester",
    gasSafety: { status: "expired", detail: "Expired 12 Jan 2026" },
    epc: { status: "valid", detail: "Grade C — Valid until 2029" },
    eicr: { status: "valid", detail: "Valid until 15 Aug 2028" },
    pat: { status: "valid", detail: "Valid until 30 Apr 2026" },
    legionella: { status: "expiring", detail: "Expiring in 14 days" },
    fireAlarm: { status: "valid", detail: "Valid until 22 Dec 2026" },
  },
  {
    address: "Flat 12, Skyline Plaza, London SE1",
    region: "London",
    gasSafety: { status: "valid", detail: "Valid until 03 Jul 2026" },
    epc: { status: "valid", detail: "Grade A — Valid until 2032" },
    eicr: { status: "valid", detail: "Valid until 19 Feb 2029" },
    pat: { status: "valid", detail: "Valid until 11 Oct 2026" },
    legionella: { status: "valid", detail: "Valid until 25 May 2027" },
    fireAlarm: { status: "valid", detail: "Valid until 09 Sep 2026" },
  },
  {
    address: "The Orchards, High St, Birmingham B1",
    region: "Birmingham",
    gasSafety: { status: "valid", detail: "Valid until 28 Nov 2026" },
    epc: { status: "expired", detail: "Grade F — Expired 05 Feb 2026" },
    eicr: { status: "valid", detail: "Valid until 10 Jan 2028" },
    pat: { status: "expiring", detail: "Expiring in 21 days" },
    legionella: { status: "valid", detail: "Valid until 17 Jul 2027" },
    fireAlarm: { status: "valid", detail: "Valid until 04 Apr 2026" },
  },
];

const certColumns = [
  { key: "gasSafety" as const, label: "Gas Safety (CP12)" },
  { key: "epc" as const, label: "EPC Status" },
  { key: "eicr" as const, label: "EICR (5yr)" },
  { key: "pat" as const, label: "PAT Testing" },
  { key: "legionella" as const, label: "Legionella" },
  { key: "fireAlarm" as const, label: "Fire Alarm" },
];

function StatusIcon({ status, detail }: { status: CertStatus; detail: string }) {
  if (status === "valid") {
    return (
      <span title={detail} className="inline-flex items-center justify-center">
        <CheckCircle2 className="size-5 text-brand-primary" />
      </span>
    );
  }
  if (status === "expiring") {
    return (
      <span title={detail} className="inline-flex items-center justify-center">
        <AlertTriangle className="size-5 text-warning" />
      </span>
    );
  }
  return (
    <span title={detail} className="inline-flex items-center justify-center">
      <XCircle className="size-5 text-error" />
    </span>
  );
}

export default function CompliancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "expired" | "expiring" | "compliant">("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const filteredProperties = properties.filter((p) => {
    if (searchQuery && !p.address.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter === "expired") {
      const certs = certColumns.map((c) => p[c.key]);
      return certs.some((cert) => cert.status === "expired");
    }
    if (statusFilter === "expiring") {
      const certs = certColumns.map((c) => p[c.key]);
      return certs.some((cert) => cert.status === "expiring");
    }
    if (statusFilter === "compliant") {
      const certs = certColumns.map((c) => p[c.key]);
      return certs.every((cert) => cert.status === "valid");
    }
    if (regionFilter !== "all" && p.region !== regionFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Compliance &amp; Certification Matrix
          </h1>
          <p className="text-muted-foreground">
            Manage regulatory status across your properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
          <Button size="sm">
            <CalendarPlus className="mr-2 size-4" />
            Schedule Inspection
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Total Properties</p>
            <CardTitle className="text-3xl">12</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">Fully Compliant</p>
            <CardTitle className="text-3xl text-brand-primary">
              9 <span className="text-base font-normal text-muted-foreground">(81%)</span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <Badge className="bg-warning-light text-warning border-0 text-xs">Action Req.</Badge>
            </div>
            <CardTitle className="text-3xl text-warning">2</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Expired</p>
              <Badge className="bg-error-light text-error border-0 text-xs">Critical</Badge>
            </div>
            <CardTitle className="text-3xl text-error">1</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">All Statuses</option>
                <option value="expired">Expired</option>
                <option value="expiring">Expiring Soon</option>
                <option value="compliant">Compliant</option>
              </select>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <option value="all">All Regions</option>
                <option value="London">London</option>
                <option value="Manchester">Manchester</option>
                <option value="Birmingham">Birmingham</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Matrix Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="sticky left-0 z-10 min-w-[240px] bg-muted/50">
                    Property Address
                  </TableHead>
                  {certColumns.map((col) => (
                    <TableHead key={col.key} className="text-center">
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProperties.map((property, i) => (
                  <TableRow key={i}>
                    <TableCell className="sticky left-0 z-10 bg-background">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Building2 className="size-5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{property.address}</span>
                      </div>
                    </TableCell>
                    {certColumns.map((col) => (
                      <TableCell key={col.key} className="text-center">
                        <StatusIcon
                          status={property[col.key].status}
                          detail={property[col.key].detail}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1 to {filteredProperties.length} of 12 properties
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

      {/* Marketplace Banner */}
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h3 className="font-heading text-lg font-semibold">
              Need a fast compliance renewal?
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge className="border-0 bg-white/10 text-white">
                <BadgeCheck className="mr-1 size-3" />
                Vetted Pro
              </Badge>
              <Badge className="border-0 bg-white/10 text-white">
                <Zap className="mr-1 size-3" />
                Fast Track
              </Badge>
              <Badge className="border-0 bg-white/10 text-white">
                <ScrollText className="mr-1 size-3" />
                Digi-Cert
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="bg-brand-primary hover:bg-brand-primary-light">
              Browse Engineers
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
              View Price List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-lg">
        <span className="flex items-center gap-1 text-xs">
          <CheckCircle2 className="size-3.5 text-brand-primary" /> Valid
        </span>
        <span className="flex items-center gap-1 text-xs">
          <AlertTriangle className="size-3.5 text-warning" /> Expiring
        </span>
        <span className="flex items-center gap-1 text-xs">
          <XCircle className="size-3.5 text-error" /> Expired
        </span>
      </div>
    </div>
  );
}
