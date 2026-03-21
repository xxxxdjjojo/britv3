
/**
 * Renter dashboard content.
 * Shows application status, tenancy details, and quick actions.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Home, Search, FileText } from "lucide-react";
import type { RenterDashboard as RenterData } from "@/types/dashboard";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  submitted: "secondary",
  under_review: "outline",
  approved: "default",
  rejected: "destructive",
};

export function RenterDashboard({ data }: Readonly<{ data: RenterData }>) {
  const hasApplications = data.application_status.length > 0;
  const hasTenancy = data.tenancy_details !== null;

  return (
    <div className="flex flex-col gap-6">
      {/* Application Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" />
            Application Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasApplications ? (
            <div className="flex flex-col gap-3">
              {data.application_status.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{app.property_address}</p>
                    <p className="text-muted-foreground text-xs">
                      Submitted {new Date(app.submitted_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[app.status] ?? "secondary"}>
                    {app.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <ClipboardList className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No applications yet</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                Apply to rental properties to track your application status here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenancy Details */}
      {hasTenancy && data.tenancy_details && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Home className="size-4" />
              Current Tenancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs uppercase">Address</p>
                <p className="text-sm font-medium">
                  {data.tenancy_details.property_address ?? "Not set"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Monthly Rent</p>
                <p className="text-sm font-medium">
                  {data.tenancy_details.monthly_rent
                    ? `£${data.tenancy_details.monthly_rent.toLocaleString()}`
                    : "--"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Lease Start</p>
                <p className="text-sm font-medium">
                  {data.tenancy_details.lease_start
                    ? new Date(data.tenancy_details.lease_start).toLocaleDateString("en-GB")
                    : "--"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase">Lease End</p>
                <p className="text-sm font-medium">
                  {data.tenancy_details.lease_end
                    ? new Date(data.tenancy_details.lease_end).toLocaleDateString("en-GB")
                    : "--"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/search?listing_type=rent" />}>
              <Search className="mr-2 size-4" />
              Search Rentals
            </Button>
            <Button variant="outline" render={<Link href="/dashboard/renter/applications" />}>
              <FileText className="mr-2 size-4" />
              View Applications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty overall state */}
      {!hasApplications && !hasTenancy && data.saved_rentals_count === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Search className="text-muted-foreground size-10" />
            <h3 className="text-lg font-semibold">Find your next rental</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Browse available rental properties and apply to ones that match your needs.
            </p>
            <Button render={<Link href="/search?listing_type=rent" />}>Browse Rentals</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
