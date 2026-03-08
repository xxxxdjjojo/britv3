import { createClient } from "@/lib/supabase/server";
import { getAdminCounts } from "@/services/admin-service";
import { CountCard } from "@/components/admin/CountCard";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const counts = await getAdminCounts(supabase);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of platform activity and content moderation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <CountCard
          title="Total Users"
          count={counts.totalUsers}
          href="/admin/users"
          icon="Users"
        />
        <CountCard
          title="Active Listings"
          count={counts.activeListings}
          href="/admin/moderation"
          icon="Building2"
        />
        <CountCard
          title="Pending Verifications"
          count={counts.pendingVerifications}
          href="/admin/verifications"
          icon="BadgeCheck"
        />
        <CountCard
          title="Open Reports"
          count={counts.openReports}
          href="/admin/moderation"
          icon="ShieldAlert"
        />
        <CountCard
          title="Total Reviews"
          count={counts.totalReviews}
          href="/admin/reviews"
          icon="Star"
        />
      </div>
    </div>
  );
}
