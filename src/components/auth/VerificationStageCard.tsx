"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  Clock,
  Lock,
  Upload,
  Phone,
  AlertCircle,
  Loader2,
} from "lucide-react";
import type { VerificationStage, VerificationStatus } from "@/types/auth";

type StageState = "locked" | "pending" | "submitted" | "approved" | "rejected";

function resolveState(
  status: VerificationStatus | undefined,
  isActive: boolean,
): StageState {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "submitted") return "submitted";
  if (isActive) return "pending";
  return "locked";
}

const stageActions: Record<VerificationStage, { label: string; icon: typeof Upload }> = {
  email: { label: "Verify Email", icon: Check },
  phone: { label: "Verify Phone", icon: Phone },
  identity: { label: "Upload ID", icon: Upload },
  insurance: { label: "Upload Insurance", icon: Upload },
  qualifications: { label: "Upload Certifications", icon: Upload },
  admin_review: { label: "Waiting for Admin", icon: Clock },
};

const stateStyles: Record<StageState, { dot: string; border: string; text: string }> = {
  locked: {
    dot: "bg-neutral-300",
    border: "border-neutral-200",
    text: "text-neutral-400",
  },
  pending: {
    dot: "bg-brand-primary",
    border: "border-brand-primary/30",
    text: "text-foreground",
  },
  submitted: {
    dot: "bg-warning",
    border: "border-warning/30",
    text: "text-foreground",
  },
  approved: {
    dot: "bg-success",
    border: "border-success/30",
    text: "text-foreground",
  },
  rejected: {
    dot: "bg-error",
    border: "border-error/30",
    text: "text-foreground",
  },
};

export function VerificationStageCard(
  props: Readonly<{
    stage: VerificationStage;
    label: string;
    description: string;
    status?: VerificationStatus;
    isActive: boolean;
    rejectionReason?: string | null;
    onSubmit?: (stage: VerificationStage, documentUrl?: string) => Promise<void>;
  }>,
) {
  const { stage, label, description, status, isActive, rejectionReason, onSubmit } = props;
  const state = resolveState(status, isActive);
  const styles = stateStyles[state];
  const action = stageActions[stage];
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!onSubmit) return;
    setSubmitting(true);
    try {
      await onSubmit(stage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            styles.dot,
          )}
        >
          {state === "approved" && <Check className="size-4 text-white" />}
          {state === "submitted" && <Clock className="size-4 text-white" />}
          {state === "rejected" && <AlertCircle className="size-4 text-white" />}
          {state === "locked" && <Lock className="size-4 text-white" />}
          {state === "pending" && (
            <span className="size-2.5 rounded-full bg-white" />
          )}
        </div>
        {/* Connector line */}
        <div className="w-0.5 flex-1 bg-neutral-200" />
      </div>

      {/* Content */}
      <Card className={cn("mb-3 flex-1 border", styles.border)}>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className={cn("font-medium", styles.text)}>{label}</h3>
            {state === "approved" && (
              <span className="text-xs font-medium text-success">Verified</span>
            )}
            {state === "submitted" && (
              <span className="text-xs font-medium text-warning">Under Review</span>
            )}
            {state === "rejected" && (
              <span className="text-xs font-medium text-error">Rejected</span>
            )}
          </div>
          <p className={cn("text-sm", state === "locked" ? "text-neutral-400" : "text-muted-foreground")}>
            {description}
          </p>

          {/* Rejection reason */}
          {state === "rejected" && rejectionReason && (
            <div className="rounded-md bg-error/10 p-2 text-xs text-error">
              {rejectionReason}
            </div>
          )}

          {/* Action buttons */}
          {(state === "pending" || state === "rejected") && stage !== "admin_review" && (
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <action.icon className="size-3.5" />
                )}
                {state === "rejected" ? "Re-apply" : action.label}
              </Button>
              {state === "rejected" && (
                <Link
                  href="/help?topic=verification"
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  Contact Support
                </Link>
              )}
            </div>
          )}

          {/* Admin review waiting state */}
          {stage === "admin_review" && state === "pending" && (
            <p className="text-xs text-muted-foreground italic">
              This stage will begin automatically when all prior stages are approved.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
