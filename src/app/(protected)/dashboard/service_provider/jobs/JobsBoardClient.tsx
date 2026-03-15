"use client";

import Link from "next/link";
import {
  Briefcase,
  MapPin,
  PoundSterling,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ServiceRequest } from "@/types/marketplace";

const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  conveyancing: "Conveyancing",
  surveying: "Surveying",
  mortgage_broker: "Mortgage Broker",
  moving_company: "Moving Company",
  home_inspector: "Home Inspector",
  cleaning: "Cleaning",
  handyman: "Handyman",
  plumber: "Plumber",
  electrician: "Electrician",
  landscaping: "Landscaping",
  interior_design: "Interior Design",
  architect: "Architect",
  property_management: "Property Management",
  pest_control: "Pest Control",
  locksmith: "Locksmith",
  other: "Other",
};

function formatBudget(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Budget TBC";
  if (min != null && max != null)
    return `£${min.toLocaleString()} – £${max.toLocaleString()}`;
  if (min != null) return `From £${min.toLocaleString()}`;
  return `Up to £${max!.toLocaleString()}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isUrgent(urgency: string): boolean {
  return urgency === "emergency" || urgency === "high";
}

type JobsBoardClientProps = Readonly<{
  rfqs: ServiceRequest[];
  total: number;
}>;

export default function JobsBoardClient({ rfqs, total }: JobsBoardClientProps) {
  const urgentCount = rfqs.filter((r) => isUrgent(r.urgency_level)).length;

  // Sum all budget midpoints for total budget range display
  const budgetValues = rfqs.flatMap((r) => {
    const vals: number[] = [];
    if (r.budget_min != null) vals.push(r.budget_min);
    if (r.budget_max != null) vals.push(r.budget_max);
    return vals;
  });
  const budgetMin = budgetValues.length > 0 ? Math.min(...budgetValues) : null;
  const budgetMax = budgetValues.length > 0 ? Math.max(...budgetValues) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <p className="text-muted-foreground">
          Manage your active jobs, leads, and completed work
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New Leads</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{rfqs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Urgent Leads</CardDescription>
            <CardTitle className="text-3xl text-red-600">{urgentCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Jobs</CardDescription>
            <CardTitle className="text-3xl">0</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Budget Range</CardDescription>
            <CardTitle className="text-xl">
              {budgetMin != null && budgetMax != null
                ? `£${budgetMin.toLocaleString()} – £${budgetMax.toLocaleString()}`
                : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">New Leads ({rfqs.length})</TabsTrigger>
          <TabsTrigger value="active">Active Jobs</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {/* New Leads tab */}
        <TabsContent value="leads">
          {rfqs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <Inbox className="size-10 text-muted-foreground/50" />
                <p className="font-medium text-foreground">No leads yet</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  When customers post jobs matching your services, they will
                  appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfqs.map((rfq) => (
                      <TableRow key={rfq.id}>
                        <TableCell className="max-w-52">
                          <p className="truncate font-medium">{rfq.title}</p>
                          {rfq.description && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {rfq.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {SERVICE_CATEGORY_LABELS[rfq.service_category] ??
                              rfq.service_category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="size-3 shrink-0" />
                            {rfq.property_postcode}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <PoundSterling className="size-3 shrink-0" />
                            {formatBudget(rfq.budget_min, rfq.budget_max)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(rfq.created_at)}
                        </TableCell>
                        <TableCell>
                          {isUrgent(rfq.urgency_level) ? (
                            <Badge
                              variant="destructive"
                              className="flex w-fit items-center gap-1"
                            >
                              <AlertTriangle className="size-3" />
                              Urgent
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="capitalize">
                              {rfq.urgency_level}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" asChild>
                            <Link href={`/dashboard/rfqs/${rfq.id}`}>
                              Send Quote
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {total > rfqs.length && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Showing {rfqs.length} of {total} leads
            </p>
          )}
        </TabsContent>

        {/* Active Jobs tab */}
        <TabsContent value="active">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Briefcase className="size-10 text-muted-foreground/50" />
              <p className="font-medium text-foreground">No active jobs yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Once a customer accepts your quote, the job will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed tab */}
        <TabsContent value="completed">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <Briefcase className="size-10 text-muted-foreground/50" />
              <p className="font-medium text-foreground">No completed jobs yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Completed jobs and customer reviews will appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
