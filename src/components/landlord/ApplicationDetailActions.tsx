"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { TenantApplication, TenantApplicationStatus } from "@/types/landlord";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const NEXT_STAGE: Partial<Record<TenantApplicationStatus, TenantApplicationStatus>> = {
  received: "shortlisted",
  shortlisted: "referencing",
};

const STAGE_LABELS: Record<TenantApplicationStatus, string> = {
  received: "Received",
  shortlisted: "Shortlisted",
  referencing: "Referencing",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const STAGE_DESCRIPTIONS: Partial<Record<TenantApplicationStatus, string>> = {
  shortlisted: "Applicant will be added to your shortlist for further review.",
  referencing: "Reference checks will be initiated for this applicant.",
};

type Props = Readonly<{ application: TenantApplication }>;

export function ApplicationDetailActions({ application }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const nextStage = NEXT_STAGE[application.status];

  if (!nextStage) return null;

  async function handleAdvance() {
    if (!nextStage) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tenant_applications")
        .update({ status: nextStage, updated_at: new Date().toISOString() })
        .eq("id", application.id);

      if (error) throw new Error(error.message);

      toast.success(`Moved to ${STAGE_LABELS[nextStage]}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl border-[color:var(--color-brand-primary)]/20 dark:border-brand-primary/20 bg-[color:var(--color-brand-primary-lighter)]/50 dark:bg-[color:var(--color-brand-primary)]/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading text-[color:var(--color-brand-primary)] dark:text-brand-primary">
          Advance Stage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {STAGE_DESCRIPTIONS[nextStage] && (
          <p className="text-xs text-muted-foreground">
            {STAGE_DESCRIPTIONS[nextStage]}
          </p>
        )}
        <Button
          onClick={handleAdvance}
          disabled={loading}
          className="w-full bg-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-brand-primary-light)] text-white font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              Move to {STAGE_LABELS[nextStage]}
              <ArrowRight className="ml-2 size-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
