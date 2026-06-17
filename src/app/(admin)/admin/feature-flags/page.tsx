import { getFeatureFlags } from "@/services/admin/feature-flag-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { FeatureFlagsClient } from "@/components/admin/FeatureFlagsClient";
import { Flag } from "lucide-react";

export default async function FeatureFlagsPage() {
  const flags = await getFeatureFlags();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operations"
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
