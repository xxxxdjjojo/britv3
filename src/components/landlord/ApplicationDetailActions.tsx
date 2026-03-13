"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={handleAdvance}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? "Updating..." : `Move to ${STAGE_LABELS[nextStage]}`}
        </Button>
      </CardContent>
    </Card>
  );
}
