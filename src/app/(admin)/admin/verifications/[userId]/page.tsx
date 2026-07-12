import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getProviderReferencesForAdmin,
} from "@/services/admin/verification-service";
import {
  getVouchRules,
  countValidVouches,
  evaluateVouchGate,
} from "@/services/provider/vouch-rules-service";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { VouchCountsBanner } from "@/components/admin/VouchCountsBanner";
import { AdminReferencesPanel } from "@/components/admin/AdminReferencesPanel";
import { ProviderDecisionControl } from "@/components/admin/ProviderDecisionControl";

// The (admin) layout already gates every route in this group to is_admin +
// admin_role, so this server component needs no additional auth check.

export default async function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, provider_verification_status")
    .eq("id", userId)
    .maybeSingle();

  const rules = await getVouchRules(supabase);
  const [references, counts] = await Promise.all([
    getProviderReferencesForAdmin(supabase, userId),
    countValidVouches(supabase, userId, rules),
  ]);
  const gate = evaluateVouchGate(counts, rules);

  const displayName =
    (profile as { display_name?: string | null } | null)?.display_name ??
    "Unknown provider";
  const status =
    (profile as { provider_verification_status?: string | null } | null)
      ?.provider_verification_status ?? "—";

  return (
    <div>
      <Link
        href="/admin/verifications"
        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to queue
      </Link>

      <AdminPageHeader
        eyebrow="Moderation"
        title={displayName}
        description={`Verification status: ${status}`}
      />

      <div className="space-y-6">
        <VouchCountsBanner counts={counts} rules={rules} gate={gate} />

        <ProviderDecisionControl
          userId={userId}
          gateEnabled={gate.gateEnabled}
          allMet={gate.allMet}
        />

        <section>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">
            References ({references.length})
          </h2>
          <AdminReferencesPanel references={references} />
        </section>
      </div>
    </div>
  );
}
