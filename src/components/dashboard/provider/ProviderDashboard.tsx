"use client";

/**
 * Service Provider dashboard content.
 * Shows verification progress, pending quotes, active jobs, and quick actions.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Briefcase, Star, UserCheck } from "lucide-react";
import type { ProviderDashboard as ProviderData } from "@/types/dashboard";

const VERIFICATION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  verified: "default",
  pending: "outline",
  rejected: "destructive",
};

const VERIFICATION_STAGES = [
  { label: "Email", order: 1 },
  { label: "Phone", order: 2 },
  { label: "Identity", order: 3 },
  { label: "Insurance", order: 4 },
  { label: "Qualifications", order: 5 },
  { label: "Admin Review", order: 6 },
] as const;

export function ProviderDashboard({ data }: Readonly<{ data: ProviderData }>) {
  const isVerified = data.verification_status === "verified";

  return (
    <div className="flex flex-col gap-6">
      {/* Verification Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" />
            Verification Status
            <Badge
              variant={VERIFICATION_VARIANTS[data.verification_status] ?? "secondary"}
              className="ml-auto"
            >
              {data.verification_status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isVerified ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
              <UserCheck className="size-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Fully Verified
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Your profile is verified. You can receive jobs and quotes.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                Complete all verification stages to start receiving jobs.
              </p>
              <div className="flex flex-wrap gap-2">
                {VERIFICATION_STAGES.map((stage) => (
                  <div
                    key={stage.order}
                    className="bg-muted flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                  >
                    <div className="bg-muted-foreground/30 size-2 rounded-full" />
                    {stage.label}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-fit" render={<Link href="/dashboard/service_provider/verification" />}>
                Continue Verification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="size-4" />
            Active Jobs
            {data.active_jobs_count > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {data.active_jobs_count}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.active_jobs_count > 0 ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <p className="text-sm">
                You have <span className="font-semibold">{data.active_jobs_count}</span>{" "}
                active job{data.active_jobs_count !== 1 ? "s" : ""}.
              </p>
              <Button variant="outline" size="sm" render={<Link href="/dashboard/service_provider/jobs" />}>
                View Jobs
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Briefcase className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No active jobs</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                {isVerified
                  ? "New jobs will appear here when clients request your services."
                  : "Complete verification to start receiving job requests."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating */}
      {data.average_rating > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="size-4" />
              Your Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{data.average_rating.toFixed(1)}</span>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`size-5 ${
                      star <= Math.round(data.average_rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Quotes */}
      {data.pending_quotes_count > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">Pending Quotes</p>
              <p className="text-muted-foreground text-xs">
                {data.pending_quotes_count} quote{data.pending_quotes_count !== 1 ? "s" : ""} awaiting response
              </p>
            </div>
            <Button variant="outline" size="sm" render={<Link href="/dashboard/service_provider/quotes" />}>
              View Quotes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty overall state */}
      {!isVerified && data.active_jobs_count === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <ShieldCheck className="text-muted-foreground size-10" />
            <h3 className="text-lg font-semibold">Complete your profile</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Complete verification to start receiving job requests from property owners.
            </p>
            <Button render={<Link href="/dashboard/service_provider/verification" />}>
              Start Verification
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
