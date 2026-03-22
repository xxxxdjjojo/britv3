"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { cn } from "@/lib/utils";
import { Shield, Loader2, CheckCircle, XCircle } from "lucide-react";

type KycStatus = "not_started" | "processing" | "approved" | "declined";

export function KycStep(
  props: Readonly<{
    stepNumber: number;
    onSubmit: () => void;
    onBack: () => void;
    onSkip: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [status, setStatus] = useState<KycStatus>("not_started");
  const [checkId, setCheckId] = useState<string | null>(null);

  async function initiateKyc() {
    setStatus("processing");

    const result = await saveStep(async (supabase) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call KYC initiation API
      const res = await fetch("/api/verify/kyc/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!res.ok) throw new Error("Failed to initiate KYC");
      const data = await res.json();
      setCheckId(data.check_id);
      return data;
    });

    if (!result) setStatus("not_started");
  }

  // Poll for status when processing
  useEffect(() => {
    if (status !== "processing" || !checkId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/verify/kyc/initiate?check_id=${checkId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "approved") {
            setStatus("approved");
            clearInterval(interval);
          } else if (data.status === "declined") {
            setStatus("declined");
            clearInterval(interval);
          }
        }
      } catch {
        // Non-blocking
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, checkId]);

  const statusConfig = {
    not_started: { icon: Shield, text: "Identity verification required", color: "text-neutral-500" },
    processing: { icon: Loader2, text: "Verification in progress...", color: "text-amber-600" },
    approved: { icon: CheckCircle, text: "Identity verified", color: "text-emerald-600" },
    declined: { icon: XCircle, text: "Verification declined — please retry", color: "text-red-600" },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Identity Verification (KYC)
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Verify your identity to earn the trusted professional badge.
        </p>
      </div>

      {/* Status display */}
      <div className={cn("flex items-center gap-3 rounded-xl border p-5",
        status === "approved" ? "border-emerald-200 bg-emerald-50/50" : "border-neutral-200 bg-white"
      )}>
        <StatusIcon className={cn("size-6", config.color, status === "processing" && "animate-spin")} />
        <div>
          <p className={cn("text-sm font-semibold", config.color)}>{config.text}</p>
          {status === "not_started" && (
            <p className="text-xs text-neutral-400">You&apos;ll need a valid government-issued photo ID (passport, driving licence).</p>
          )}
          {status === "processing" && (
            <p className="text-xs text-neutral-400">This usually takes a few minutes. You can continue and come back.</p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">Back</Button>
        {status === "not_started" && (
          <Button onClick={initiateKyc} disabled={saving} className="flex-1">
            {saving ? "Starting..." : "Start Verification"}
          </Button>
        )}
        {(status === "processing" || status === "approved") && (
          <Button onClick={props.onSubmit} className="flex-1">
            {status === "approved" ? "Continue" : "Continue (verify later)"}
          </Button>
        )}
        {status === "declined" && (
          <Button onClick={initiateKyc} disabled={saving} className="flex-1">
            Retry Verification
          </Button>
        )}
      </div>

      {status === "not_started" && (
        <button
          type="button"
          onClick={props.onSkip}
          className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600"
        >
          Skip for now
        </button>
      )}
    </div>
  );
}
