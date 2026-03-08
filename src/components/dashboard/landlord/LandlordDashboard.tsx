"use client";

/**
 * Landlord dashboard content.
 * Shows portfolio overview, income summary, and quick actions.
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
import { Building, PoundSterling, Users, Plus } from "lucide-react";
import type { LandlordDashboard as LandlordData } from "@/types/dashboard";

const PROPERTY_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  occupied: "default",
  vacant: "outline",
  maintenance: "destructive",
};

export function LandlordDashboard({ data }: Readonly<{ data: LandlordData }>) {
  const hasProperties = data.properties.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="size-4" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasProperties ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Rent</TableHead>
                    <TableHead>Lease End</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.properties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {property.address}
                      </TableCell>
                      <TableCell>{property.tenant_name ?? "--"}</TableCell>
                      <TableCell className="text-right">
                        £{property.monthly_rent.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {property.lease_end
                          ? new Date(property.lease_end).toLocaleDateString("en-GB")
                          : "--"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={PROPERTY_STATUS_VARIANTS[property.status] ?? "secondary"}>
                          {property.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Building className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No properties in portfolio</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                Add your rental properties to track occupancy and income.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income Summary (placeholder for chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PoundSterling className="size-4" />
            Income Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-muted-foreground text-sm">
              {hasProperties
                ? `Total monthly income: £${data.total_income.toLocaleString()}`
                : "Income charts will appear once you add properties."}
            </p>
            <p className="text-muted-foreground text-xs">
              Detailed income charts coming soon.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/dashboard/landlord/properties/new" />}>
              <Plus className="mr-2 size-4" />
              Add Property
            </Button>
            <Button variant="outline" render={<Link href="/dashboard/landlord/portfolio" />}>
              <Users className="mr-2 size-4" />
              View Tenants
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty overall state */}
      {!hasProperties && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Building className="text-muted-foreground size-10" />
            <h3 className="text-lg font-semibold">Add your first rental property</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Start building your portfolio by adding your rental properties.
            </p>
            <Button render={<Link href="/dashboard/landlord/properties/new" />}>Add Property</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
