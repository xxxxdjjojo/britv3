import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/auth";
import { ROLES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Heart,
  Search,
  Eye,
  ClipboardList,
  Home,
  Tag,
  TrendingUp,
  PoundSterling,
  Building,
  Users,
  Star,
  MessagesSquare,
  Briefcase,
} from "lucide-react";

type MetricCard = Readonly<{
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

const ROLE_METRICS: Record<UserRole, MetricCard[]> = {
  homebuyer: [
    { label: "Saved Properties", value: "0", icon: Heart },
    { label: "Active Searches", value: "0", icon: Search },
    { label: "Upcoming Viewings", value: "0", icon: Eye },
  ],
  renter: [
    { label: "Saved Rentals", value: "0", icon: Heart },
    { label: "Applications", value: "0", icon: ClipboardList },
    { label: "Tenancy Status", value: "None", icon: Home },
  ],
  seller: [
    { label: "Active Listings", value: "0", icon: Tag },
    { label: "Total Views", value: "0", icon: Eye },
    { label: "Offers", value: "0", icon: PoundSterling },
  ],
  landlord: [
    { label: "Properties", value: "0", icon: Building },
    { label: "Occupancy Rate", value: "--", icon: TrendingUp },
    { label: "Monthly Income", value: "--", icon: PoundSterling },
  ],
  agent: [
    { label: "Active Listings", value: "0", icon: Building },
    { label: "Leads", value: "0", icon: Users },
    { label: "Revenue", value: "--", icon: TrendingUp },
  ],
  service_provider: [
    { label: "Active Jobs", value: "0", icon: Briefcase },
    { label: "Pending Quotes", value: "0", icon: MessagesSquare },
    { label: "Rating", value: "--", icon: Star },
  ],
};

export default async function RoleDashboardPage(
  props: Readonly<{
    params: Promise<{ role: string }>;
  }>,
) {
  const { role } = await props.params;
  const typedRole = role as UserRole;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? user.email ?? "there";
  const roleDef = ROLES.find((r) => r.value === typedRole);
  const metrics = ROLE_METRICS[typedRole] ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-neutral-500">
          {roleDef?.label} Dashboard
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">
                {metric.label}
              </CardTitle>
              <metric.icon className="size-5 text-neutral-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-neutral-900">
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100">
            <Search className="size-8 text-neutral-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-neutral-900">
            Get started with Britestate
          </h3>
          <p className="mt-2 max-w-md text-sm text-neutral-500">
            Your {roleDef?.label?.toLowerCase()} dashboard is ready. Start exploring
            to see your activity and insights here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
