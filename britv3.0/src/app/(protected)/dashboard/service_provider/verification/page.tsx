"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VerificationPipeline } from "@/components/auth/VerificationPipeline";
import { useAuth } from "@/hooks/useAuth";
import { VERIFICATION_LEVELS } from "@/lib/constants";

export default function ProviderVerificationPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verification Status</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete the verification stages below to unlock full marketplace access.
        </p>
      </div>

      {/* Pipeline */}
      <VerificationPipeline userId={user.id} />

      {/* Info card: verification levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-primary" />
            Verification Levels
          </CardTitle>
          <CardDescription>
            Each level unlocks additional platform capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {VERIFICATION_LEVELS.map((level) => (
              <div key={level.value} className="flex items-start gap-3">
                <span className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24 shrink-0">
                  {level.label}
                </span>
                <span className="text-sm text-foreground">{level.unlocks}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
