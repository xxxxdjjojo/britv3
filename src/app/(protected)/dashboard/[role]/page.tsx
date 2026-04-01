"use client";

/**
 * Dynamic role-based dashboard page.
 * Fetches aggregated dashboard data via useDashboard hook and renders
 * the appropriate role-specific dashboard component inside DashboardShell.
 */

import { use } from "react";
import { redirect } from "next/navigation";
import { DashboardShell, StatCardGrid } from "@/components/dashboard/DashboardShell";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { useDashboard, useRefreshDashboard } from "@/hooks/useDashboard";
import { HomebuyerDashboard } from "@/components/dashboard/homebuyer/HomebuyerDashboard";
import { RenterDashboard } from "@/components/dashboard/renter/RenterDashboard";
import { SellerDashboard } from "@/components/dashboard/seller/SellerDashboard";
import { LandlordDashboard } from "@/components/dashboard/landlord/LandlordDashboard";
import { AgentDashboard } from "@/components/dashboard/agent/AgentDashboard";
import { ProviderDashboard } from "@/components/dashboard/provider/ProviderDashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { UserRole } from "@/types/auth";
import type { DashboardData, StatCardData } from "@/types/dashboard";

// ---------------------------------------------------------------------------
// Stat card configurations per role
// ---------------------------------------------------------------------------

function getStatCards(data: DashboardData): StatCardData[] {
  switch (data.role) {
    case "homebuyer":
      return [
        { label: "Saved Properties", value: data.saved_properties_count, change: 0, trend: "neutral", icon: "Heart" },
        { label: "Active Searches", value: data.active_searches_count, change: 0, trend: "neutral", icon: "Search" },
        { label: "Upcoming Viewings", value: data.upcoming_viewings.length, change: 0, trend: "neutral", icon: "Calendar" },
        { label: "Recent Views", value: data.recent_activity.length, change: 0, trend: "neutral", icon: "Eye" },
      ];
    case "renter":
      return [
        { label: "Saved Rentals", value: data.saved_rentals_count, change: 0, trend: "neutral", icon: "Heart" },
        { label: "Applications Sent", value: data.application_status.length, change: 0, trend: "neutral", icon: "FileText" },
        { label: "Active Tenancy", value: data.tenancy_details ? "Yes" : "None", change: 0, trend: "neutral", icon: "Home" },
        { label: "Rent Due In", value: data.tenancy_details ? "See details" : "--", change: 0, trend: "neutral", icon: "Calendar" },
      ];
    case "seller":
      return [
        { label: "Active Listings", value: data.listings.filter((l) => l.status === "active").length, change: 0, trend: "neutral", icon: "Tag" },
        { label: "Total Views", value: data.listings.reduce((s, l) => s + l.views_count, 0), change: 0, trend: "neutral", icon: "Eye" },
        { label: "Total Saves", value: data.listings.reduce((s, l) => s + l.saves_count, 0), change: 0, trend: "neutral", icon: "Heart" },
        { label: "Total Enquiries", value: data.listings.reduce((s, l) => s + l.enquiries_count, 0), change: 0, trend: "neutral", icon: "FileText" },
      ];
    case "landlord":
      return [
        { label: "Properties", value: data.portfolio_count, change: 0, trend: "neutral", icon: "Building" },
        { label: "Occupancy Rate", value: `${Math.round(data.occupancy_rate * 100)}%`, change: 0, trend: "neutral", icon: "Home" },
        { label: "Monthly Income", value: `£${data.total_income.toLocaleString()}`, change: 0, trend: "neutral", icon: "PoundSterling" },
        { label: "Maintenance Open", value: 0, change: 0, trend: "neutral", icon: "Briefcase" },
      ];
    case "agent":
      return [
        { label: "Active Listings", value: data.active_listings_count, change: 0, trend: "neutral", icon: "Building" },
        { label: "Total Leads", value: Object.values(data.leads_pipeline).reduce((s, v) => s + v, 0), change: 0, trend: "neutral", icon: "Users" },
        { label: "Viewings This Week", value: data.viewings.length, change: 0, trend: "neutral", icon: "Calendar" },
        { label: "Revenue MTD", value: `£${data.revenue.current_month.toLocaleString()}`, change: 0, trend: "neutral", icon: "PoundSterling" },
      ];
    case "service_provider":
      return [
        { label: "Verification", value: data.verification_status === "verified" ? "Verified" : data.verification_status, change: 0, trend: "neutral", icon: "Star" },
        { label: "Active Jobs", value: data.active_jobs_count, change: 0, trend: "neutral", icon: "Briefcase" },
        { label: "Avg Rating", value: data.average_rating > 0 ? data.average_rating.toFixed(1) : "--", change: 0, trend: "neutral", icon: "Star" },
        { label: "Earnings MTD", value: `£${data.total_earnings.toLocaleString()}`, change: 0, trend: "neutral", icon: "PoundSterling" },
      ];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Role content renderer
// ---------------------------------------------------------------------------

function RoleDashboardContent({ data }: Readonly<{ data: DashboardData }>) {
  switch (data.role) {
    case "homebuyer":
      return <HomebuyerDashboard data={data} />;
    case "renter":
      return <RenterDashboard data={data} />;
    case "seller":
      return <SellerDashboard data={data} />;
    case "landlord":
      return <LandlordDashboard data={data} />;
    case "agent":
      return <AgentDashboard data={data} />;
    case "service_provider":
      return <ProviderDashboard data={data} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const VALID_ROLES: ReadonlyArray<UserRole> = [
  "homebuyer",
  "renter",
  "seller",
  "landlord",
  "agent",
  "service_provider",
  "mortgage_broker",
];

export default function RoleDashboardPage(
  props: Readonly<{
    params: Promise<{ role: string }>;
  }>,
) {
  const { role } = use(props.params);

  // All hooks must be called unconditionally before any early return
  const { data: result, isLoading, isError, refetch } = useDashboard();
  const refreshDashboard = useRefreshDashboard();

  // Validation after all hooks have been called
  if (!VALID_ROLES.includes(role as UserRole)) {
    redirect("/dashboard/homebuyer");
  }

  const typedRole = role as UserRole;

  // Loading state
  if (isLoading) {
    if (role === "homebuyer") {
      return (
        <div className="min-h-screen bg-surface px-4 py-8 md:px-8 lg:px-12 flex flex-col gap-8">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      );
    }
    return (
      <DashboardShell role={typedRole}>
        <StatCardGrid>
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </StatCardGrid>
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
      </DashboardShell>
    );
  }

  // Error state
  if (isError || !result?.data) {
    return (
      <DashboardShell role={typedRole}>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="bg-destructive/10 flex size-12 items-center justify-center rounded-full">
              <AlertCircle className="text-destructive size-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Failed to load dashboard</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Something went wrong loading your dashboard data.
              </p>
            </div>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="mr-2 size-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  const dashboardData = result.data;
  const statCards = getStatCards(dashboardData);

  // Homebuyer dashboard has its own fully-styled layout (Stitch design).
  // Render it standalone without the generic shell stat cards.
  if (typedRole === "homebuyer") {
    return (
      <div className="min-h-screen bg-surface px-4 py-8 md:px-8 lg:px-12">
        <RoleDashboardContent data={dashboardData} />
      </div>
    );
  }

  return (
    <DashboardShell
      role={typedRole}
      sidebar={<ActivityFeed />}
    >
      {/* Refresh button */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refreshDashboard()}
          className="text-muted-foreground"
        >
          <RefreshCw className="mr-1.5 size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <StatCardGrid>
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </StatCardGrid>

      {/* Role-specific content */}
      <RoleDashboardContent data={dashboardData} />
    </DashboardShell>
  );
}
