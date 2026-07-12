import { createClient } from "@/lib/supabase/server";
import { getVerificationQueue } from "@/services/admin/verification-service";
import { getVouchRules } from "@/services/provider/vouch-rules-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { VerificationQueueClient } from "@/components/admin/VerificationQueueClient";
import { VouchRulesEditor } from "@/components/admin/VouchRulesEditor";
import { BadgeCheck } from "lucide-react";

export default async function AdminVerificationsPage() {
  const supabase = await createClient();
  const [verifications, rules] = await Promise.all([
    getVerificationQueue(supabase),
    getVouchRules(supabase),
  ]);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Moderation"
        title="Provider Verifications"
        description={`${verifications.length} item${verifications.length !== 1 ? "s" : ""} awaiting review.`}
      />

      <div className="mb-8">
        <VouchRulesEditor rules={rules} />
      </div>

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
