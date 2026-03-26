import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { FraudDetectionClient } from "@/components/admin/FraudDetectionClient";
import { ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export type FraudSignal = {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string | null;
  createdAt: string | null;
  isSuspended: boolean | null;
  reportCount: number;
  riskScore: number;
};

function computeRiskScore(
  createdAt: string | null,
  reportCount: number,
  isSuspended: boolean | null,
  now: number,
): number {
  let score = 0;

  // Report-based scoring: each report adds 20 pts (max 60)
  score += Math.min(reportCount * 20, 60);

  // New account signal: created in last 7 days adds 20
  if (createdAt) {
    const daysSinceCreation =
      (now - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) score += 20;
    else if (daysSinceCreation < 30) score += 10;
  }

  // Already suspended: bump to at least 40 to surface it
  if (isSuspended) score = Math.max(score, 40);

  return Math.min(score, 100);
}


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
  const now = Date.now();
  const supabase = await createClient();

  // Fetch users with at least one report
  const { data: reportData } = await supabase
    .from("content_reports")
    .select("reported_user_id")
    .not("reported_user_id", "is", null)
    .limit(500);

  // Count reports per user
  const reportCounts: Record<string, number> = {};
  for (const row of reportData ?? []) {
    const uid = row.reported_user_id as string;
    reportCounts[uid] = (reportCounts[uid] ?? 0) + 1;
  }

  const reportedUserIds = Object.keys(reportCounts);

  // Fetch new accounts (last 14 days) with high activity (to layer in)
  const twoWeeksAgo = new Date(
    now - 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: newUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_suspended, created_at")
    .gte("created_at", twoWeeksAgo)
    .eq("is_suspended", false)
    .limit(100);

  // Combine: all reported users + new accounts
  const allCandidateIds = new Set([
    ...reportedUserIds,
    ...(newUsers ?? []).map((u) => u.id as string),
  ]);

  let signals: FraudSignal[] = [];

  if (allCandidateIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_suspended, created_at")
      .in("id", [...allCandidateIds])
      .limit(200);

    signals = (profiles ?? [])
      .map((p) => {
        const reportCount = reportCounts[p.id as string] ?? 0;
        const riskScore = computeRiskScore(
          p.created_at as string | null,
          reportCount,
          p.is_suspended as boolean | null,
          now,
        );
        return {
          userId: p.id as string,
          fullName: p.full_name as string | null,
          email: p.email as string | null,
          role: p.role as string | null,
          createdAt: p.created_at as string | null,
          isSuspended: p.is_suspended as boolean | null,
          reportCount,
          riskScore,
        };
      })
      .filter((s) => s.riskScore >= 20)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  return (
    <div>
      <AdminPageHeader
        title="Fraud Detection"
        description="Rule-based risk scoring for users showing suspicious signals."
      />

      {signals.length === 0 ? (
        <AdminEmptyState
          icon={ShieldAlert}
          title="No high-risk users detected"
          description="Users with risk scores ≥ 20 will appear here based on reports and account age."
        />
      ) : (
        <FraudDetectionClient signals={signals} />
      )}
    </div>
  );
}

export default function FraudDetectionPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
