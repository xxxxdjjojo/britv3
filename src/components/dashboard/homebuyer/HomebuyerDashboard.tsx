"use client";

/**
 * Homebuyer dashboard content.
 * Shows upcoming viewings, saved properties, and quick actions.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Heart, Search, MapPin } from "lucide-react";
import type { HomebuyerDashboard as HomebuyerData } from "@/types/dashboard";

export function HomebuyerDashboard({ data }: Readonly<{ data: HomebuyerData }>) {
  const hasViewings = data.upcoming_viewings.length > 0;
  const hasActivity = data.recent_activity.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Upcoming Viewings */}
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
              {data.upcoming_viewings.map((viewing) => (
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
            <EmptyState
              icon={<Calendar className="text-muted-foreground size-8" />}
              title="No upcoming viewings"
              description="Book a viewing on a property you like to see it in person."
            />
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
            <Button variant="outline" render={<Link href="/search" />}>
              <Search className="mr-2 size-4" />
              Search Properties
            </Button>
            <Button variant="outline" render={<Link href="/dashboard/homebuyer/saved" />}>
              <Heart className="mr-2 size-4" />
              View Shortlist
            </Button>
            <Button variant="outline" render={<Link href="/search?type=map" />}>
              <MapPin className="mr-2 size-4" />
              Map Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty overall state */}
      {!hasViewings && !hasActivity && data.saved_properties_count === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Heart className="text-muted-foreground size-10" />
            <h3 className="text-lg font-semibold">Save your first property</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Start searching for properties and save the ones you love to track them here.
            </p>
            <Button render={<Link href="/search" />}>Start Searching</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared empty state component
// ---------------------------------------------------------------------------

function EmptyState({
  icon,
  title,
  description,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
}>) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      {icon}
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground max-w-xs text-xs">{description}</p>
    </div>
  );
}
