"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { VerificationStageCard } from "@/components/auth/VerificationStageCard";
import { VERIFICATION_STAGES, VERIFICATION_LEVELS } from "@/lib/constants";
import type {
  ProviderVerification,
  VerificationLevel,
  VerificationStage,
} from "@/types/auth";
import {
  getVerificationStatus,
  getVerificationProgress,
  submitVerification,
} from "@/services/auth/verification-service";

type ProgressData = {
  completedStages: VerificationStage[];
  currentStage: VerificationStage | null;
  level: VerificationLevel;
  percentage: number;
};

const levelColors: Record<VerificationLevel, string> = {
  basic: "bg-neutral-500 text-white",
  standard: "bg-blue-500 text-white",
  enhanced: "bg-purple-500 text-white",
  professional: "bg-brand-primary text-white",
};

export function VerificationPipeline(
  props: Readonly<{ userId: string }>,
) {
  const { userId } = props;
  const [records, setRecords] = useState<ProviderVerification[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const [statusResult, progressResult] = await Promise.all([
        getVerificationStatus(userId),
        getVerificationProgress(userId),
      ]);
      if (!cancelled) {
        setRecords(statusResult.data ?? []);
        setProgress(progressResult.data ?? null);
        setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [userId, refreshKey]);

  const handleSubmit = useCallback(
    async (stage: VerificationStage) => {
      const result = await submitVerification(userId, stage);
      if (!result.error) {
        setRefreshKey((k) => k + 1);
      }
    },
    [userId],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  const recordMap = new Map(records.map((r) => [r.stage, r]));
  const completedCount = progress?.completedStages.length ?? 0;
  const totalStages = VERIFICATION_STAGES.length;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount} of {totalStages} stages completed
          </span>
          {progress && (
            <Badge className={levelColors[progress.level]}>
              {VERIFICATION_LEVELS.find((l) => l.value === progress.level)?.label ?? progress.level}
            </Badge>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-500"
            style={{ width: `${progress?.percentage ?? 0}%` }}
          />
        </div>
      </div>

      {/* Stage cards */}
      <div>
        {VERIFICATION_STAGES.map((stageDef) => {
          const record = recordMap.get(stageDef.value);
          const isActive = progress?.currentStage === stageDef.value;

          return (
            <VerificationStageCard
              key={stageDef.value}
              stage={stageDef.value}
              label={stageDef.label}
              description={stageDef.description}
              status={record?.status}
              isActive={isActive}
              rejectionReason={record?.rejection_reason}
              onSubmit={handleSubmit}
            />
          );
        })}
      </div>
    </div>
  );
}
