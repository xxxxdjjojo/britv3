import { createClient } from "@/lib/supabase/server";
import { getVerificationQueue } from "@/services/admin/verification-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { VerificationQueueClient } from "@/components/admin/VerificationQueueClient";
import { BadgeCheck } from "lucide-react";

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const verifications = await getVerificationQueue(supabase);

  return (
    <div>
      <AdminPageHeader
        title="Provider Verifications"
        description={`${verifications.length} item${verifications.length !== 1 ? "s" : ""} awaiting review.`}
      />

      {verifications.length === 0 ? (
        <AdminEmptyState
          icon={BadgeCheck}
          title="No pending verifications"
          description="All provider verification applications have been reviewed."
        />
      ) : (
        <VerificationQueueClient verifications={verifications} />
      )}
    </div>
  );
}
