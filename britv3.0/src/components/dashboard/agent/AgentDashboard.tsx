"use client";

/**
 * Agent dashboard content.
 * Shows leads pipeline, today's viewings, and quick actions.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Plus, Building } from "lucide-react";
import type { AgentDashboard as AgentData } from "@/types/dashboard";

const PIPELINE_STAGES = [
  { key: "new" as const, label: "New", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { key: "contacted" as const, label: "Contacted", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { key: "viewing_booked" as const, label: "Viewing", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { key: "offer_made" as const, label: "Offer", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { key: "closed" as const, label: "Closed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
] as const;

export function AgentDashboard({ data }: Readonly<{ data: AgentData }>) {
  const totalLeads = Object.values(data.leads_pipeline).reduce((s, v) => s + v, 0);
  const hasViewings = data.viewings.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Leads Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            Leads Pipeline
            {totalLeads > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {totalLeads} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalLeads > 0 ? (
            <div className="flex flex-wrap gap-3">
              {PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage.key}
                  className={`flex flex-col items-center rounded-lg px-4 py-3 ${stage.color}`}
                >
                  <span className="text-2xl font-bold">
                    {data.leads_pipeline[stage.key]}
                  </span>
                  <span className="text-xs font-medium">{stage.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Users className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No leads yet</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                Leads from property enquiries will appear in your pipeline.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Viewings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4" />
            Upcoming Viewings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasViewings ? (
            <div className="flex flex-col gap-3">
              {data.viewings.map((viewing) => (
                <div
                  key={viewing.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{viewing.property_address}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(viewing.scheduled_at).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={viewing.status === "confirmed" ? "default" : "secondary"}
                  >
                    {viewing.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Calendar className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No upcoming viewings</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                Scheduled viewings will be listed here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/dashboard/agent/listings/new" />}>
              <Plus className="mr-2 size-4" />
              Create Listing
            </Button>
            <Button variant="outline" render={<Link href="/dashboard/agent/listings" />}>
              <Building className="mr-2 size-4" />
              Manage Listings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty overall state */}
      {data.active_listings_count === 0 && totalLeads === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Building className="text-muted-foreground size-10" />
            <h3 className="text-lg font-semibold">Create your first listing</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Start listing properties to attract buyers and generate leads.
            </p>
            <Button render={<Link href="/dashboard/agent/listings/new" />}>Create Listing</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
