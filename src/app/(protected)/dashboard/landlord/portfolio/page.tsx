"use client";

/**
 * Landlord Portfolio page — property grid with summary metrics,
 * search/filter toolbar, and compliance warnings.
 * Matches the Stitch portfolio.html design.
 */

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
  Download,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Wallet,
  PoundSterling,
  BarChart3,
  User,
} from "lucide-react";

// --- Mock data matching Stitch design ---

type ComplianceStatus = "good" | "expiring" | "overdue";

type MockProperty = {
  id: string;
  address: string;
  location: string;
  status: "Occupied" | "Vacant" | "Under Offer";
  tenant: string | null;
  monthlyRent: number;
  compliance: ComplianceStatus;
  complianceLabel: string;
  image: null;
};

const MOCK_PROPERTIES: MockProperty[] = [
  {
    id: "1",
    address: "24 Oakwood Crescent",
    location: "London SW19",
    status: "Occupied",
    tenant: "Alex Johnson",
    monthlyRent: 2450,
    compliance: "good",
    complianceLabel: "All Good",
    image: null,
  },
  {
    id: "2",
    address: "Flat 12, Victoria Court",
    location: "Manchester M1",
    status: "Vacant",
    tenant: null,
    monthlyRent: 1200,
    compliance: "expiring",
    complianceLabel: "Gas Expiring",
    image: null,
  },
  {
    id: "3",
    address: "88 Kensington High St",
    location: "London W8",
    status: "Under Offer",
    tenant: "Sarah Williams",
    monthlyRent: 4800,
    compliance: "overdue",
    complianceLabel: "Overdue EPC",
    image: null,
  },
  {
    id: "4",
    address: "12 Silver Street",
    location: "Bristol BS1",
    status: "Occupied",
    tenant: "James Smith",
    monthlyRent: 1850,
    compliance: "good",
    complianceLabel: "All Good",
    image: null,
  },
  {
    id: "5",
    address: "44 River View",
    location: "Richmond TW10",
    status: "Occupied",
    tenant: "Emily Blunt",
    monthlyRent: 3200,
    compliance: "good",
    complianceLabel: "All Good",
    image: null,
  },
  {
    id: "6",
    address: "Meadow Cottage",
    location: "Oxford OX1",
    status: "Occupied",
    tenant: "Robert Downey",
    monthlyRent: 1400,
    compliance: "good",
    complianceLabel: "All Good",
    image: null,
  },
];

const STATUS_BADGE_STYLES: Record<string, string> = {
  Occupied: "bg-success-light text-success border-0",
  Vacant: "bg-warning-light text-warning border-0",
  "Under Offer": "bg-brand-accent/10 text-brand-accent border-0",
};

const COMPLIANCE_DOT_STYLES: Record<ComplianceStatus, string> = {
  good: "bg-success",
  expiring: "bg-warning",
  overdue: "bg-error",
};

const COMPLIANCE_TEXT_STYLES: Record<ComplianceStatus, string> = {
  good: "text-success",
  expiring: "text-warning",
  overdue: "text-error",
};

export default function PortfolioPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProperties = MOCK_PROPERTIES.filter(
    (p) =>
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tenant && p.tenant.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">
            Property Portfolio
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and track your 12 active properties
          </p>
        </div>
        <Button render={<Link href="/dashboard/landlord/portfolio" />}>
          <Plus className="mr-2 size-4" />
          Add Property
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
              <Wallet className="size-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold font-heading">£4,850,000</p>
                <span className="flex items-center text-xs text-success">
                  <TrendingUp className="mr-0.5 size-3" />
                  +2.4%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
              <PoundSterling className="size-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Income</p>
              <p className="text-xl font-semibold font-heading">£18,450</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-brand-primary-lighter">
              <BarChart3 className="size-5 text-brand-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Yield</p>
              <p className="text-xl font-semibold font-heading">5.8%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
        <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:ml-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="default">
            <Filter className="mr-1.5 size-4" />
            Filter
          </Button>
          <Button variant="outline" size="default">
            <Download className="mr-1.5 size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden">
            {/* Image placeholder */}
            <div className="relative h-36 bg-muted">
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <MapPin className="size-8" />
              </div>
              <div className="absolute left-3 top-3">
                <Badge className={STATUS_BADGE_STYLES[property.status]}>
                  {property.status}
                </Badge>
              </div>
            </div>

            <CardContent className="flex flex-col gap-2 pt-3">
              <div>
                <p className="text-sm font-semibold">{property.address}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {property.location}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="size-3" />
                {property.tenant ?? "Not assigned"}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  £{property.monthlyRent.toLocaleString()}
                  <span className="font-normal text-muted-foreground">/mo</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block size-2 rounded-full ${
                      COMPLIANCE_DOT_STYLES[property.compliance]
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      COMPLIANCE_TEXT_STYLES[property.compliance]
                    }`}
                  >
                    {property.complianceLabel}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add New Asset card */}
        <Card className="flex min-h-[260px] cursor-pointer items-center justify-center border-2 border-dashed border-muted-foreground/25 bg-transparent ring-0 transition-colors hover:border-brand-primary/50 hover:bg-brand-primary-lighter/50">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Plus className="size-8" />
            <p className="text-sm font-medium">Add New Asset</p>
          </div>
        </Card>
      </div>

      {/* Compliance Warning Banner */}
      <Card className="border-warning/30 bg-warning-light">
        <CardContent className="flex items-center gap-4 pt-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10">
            <AlertTriangle className="size-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-warning">
              2 properties have certificates expiring
            </p>
            <p className="text-xs text-muted-foreground">
              Review compliance status for Flat 12, Victoria Court and 88 Kensington
              High St to avoid penalties.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-warning/50 text-warning hover:bg-warning/10"
            render={<Link href="/dashboard/landlord/compliance" />}
          >
            Review Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
