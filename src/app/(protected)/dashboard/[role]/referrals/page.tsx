"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Users, CheckCircle2, Clock, Gift } from "lucide-react";
import posthog from "posthog-js";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ReferralStats, ReferralConversion } from "@/services/referrals/referral-service";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchReferralStats(): Promise<ReferralStats> {
  const res = await fetch("/api/referrals");
  if (!res.ok) throw new Error("Failed to fetch referral stats");
  return res.json() as Promise<ReferralStats>;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ReferralSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-9 w-28" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: Readonly<{
  label: string;
  value: number;
  icon: React.ElementType;
  colorClass: string;
}>) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={["rounded-full p-2", colorClass].join(" ")}>
            <Icon className="size-4" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: Readonly<{ status: ReferralConversion["status"] }>) {
  if (status === "converted") {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="mr-1 size-3" />
        Converted
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
      <Clock className="mr-1 size-3" />
      Pending
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Referral history table
// ---------------------------------------------------------------------------

function ReferralHistoryTable({
  conversions,
}: Readonly<{ conversions: ReferralConversion[] }>) {
  if (conversions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">Referral History</h2>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <Gift className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No referrals yet — share your link to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold">Referral History</h2>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  User
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Date
                </th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {conversions.map((conversion, index) => (
                <tr key={conversion.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">
                    User #{index + 1}
                  </td>
                  <td className="px-6 py-4 tabular-nums text-muted-foreground">
                    {new Date(conversion.converted_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={conversion.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReferralsPage() {
  const {
    data: stats,
    isLoading,
    isError,
    refetch,
  } = useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: fetchReferralStats,
    staleTime: 60_000,
  });

  async function handleCopyLink() {
    if (!stats?.referral_url) return;

    try {
      await navigator.clipboard.writeText(stats.referral_url);
      toast.success("Link copied!");

      // Fire PostHog event
      posthog.capture("referral.link_shared", {
        code: stats.referral_code?.code,
      });
    } catch {
      toast.error("Failed to copy link. Please copy it manually.");
    }
  }

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refer a Friend</h1>
          <p className="text-muted-foreground">
            Share Britestate with friends and earn rewards
          </p>
        </div>
        <ReferralSkeleton />
      </div>
    );
  }

  // ---- Error ----
  if (isError || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refer a Friend</h1>
          <p className="text-muted-foreground">
            Share Britestate with friends and earn rewards
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load your referral details. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refer a Friend</h1>
        <p className="text-muted-foreground">
          Share Britestate with friends and earn rewards
        </p>
      </div>

      {/* Referral link section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Your referral link</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={stats.referral_url}
                className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                aria-label="Referral link"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={handleCopyLink}
                disabled={!stats.referral_url}
              >
                <Copy className="mr-2 size-4" />
                Copy Link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Referrals"
          value={stats.total_referrals}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Converted"
          value={stats.converted}
          icon={CheckCircle2}
          colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={Clock}
          colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      {/* Referral history table */}
      <ReferralHistoryTable conversions={stats.conversions} />
    </div>
  );
}
