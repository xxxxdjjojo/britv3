import { Suspense } from "react";
import { getFeatureFlags } from "@/services/admin/feature-flag-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { FeatureFlagsClient } from "@/components/admin/FeatureFlagsClient";
import { Flag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
  const flags = await getFeatureFlags();

  return (
    <div>
      <AdminPageHeader
        title="Feature Flags"
        description="Toggle features on/off and control rollout percentages."
      />

      {flags.length === 0 ? (
        <AdminEmptyState
          icon={Flag}
          title="No feature flags"
          description="Feature flags will appear here once configured in the database."
        />
      ) : (
        <FeatureFlagsClient flags={flags} />
      )}
    </div>
  );
}

export default function FeatureFlagsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
