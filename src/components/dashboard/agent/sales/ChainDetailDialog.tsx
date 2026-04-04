"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChainDetail, ChainRiskLevel } from "@/types/agent";

const RISK_CONFIG: Record<ChainRiskLevel, { bg: string; text: string }> = {
  low: { bg: "bg-success-light", text: "text-success" },
  medium: { bg: "bg-warning-light", text: "text-warning" },
  high: { bg: "bg-warning-light", text: "text-warning" },
  critical: { bg: "bg-error-light", text: "text-error" },
};

const HEALTH_DOT: Record<"green" | "amber" | "red", string> = {
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-error",
};

function healthDot(days: number): string {
  if (days <= 7) return HEALTH_DOT.green;
  if (days <= 14) return HEALTH_DOT.amber;
  return HEALTH_DOT.red;
}

export function ChainDetailDialog({
  chainGroupId,
  open,
  onClose,
}: Readonly<{
  chainGroupId: string;
  open: boolean;
  onClose: () => void;
}>) {
  const [detail, setDetail] = useState<ChainDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !chainGroupId) return;
    setLoading(true);
    fetch(`/api/agent/sales/chain?groupId=${encodeURIComponent(chainGroupId)}`)
      .then((res) => res.json())
      .then((data: ChainDetail) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [open, chainGroupId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold tracking-tight">
            Property Chain
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="size-2 animate-bounce rounded-full bg-brand-primary"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        ) : !detail ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-neutral-400">No chain data available.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Summary bar */}
            <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3">
              <span className="text-sm font-semibold text-neutral-800">
                {detail.total_length} links
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${RISK_CONFIG[detail.risk_level].bg} ${RISK_CONFIG[detail.risk_level].text}`}
              >
                {detail.risk_level} risk ({detail.risk_score}/100)
              </span>
            </div>

            {/* Chain diagram */}
            <div className="flex flex-col">
              {detail.members
                .sort((a, b) => a.position - b.position)
                .map((member, idx) => (
                  <div key={member.progression_id}>
                    <div
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                        member.is_own
                          ? "bg-brand-primary-lighter ring-1 ring-brand-primary/20"
                          : "bg-neutral-50"
                      } ${
                        detail.slowest_member?.progression_id ===
                        member.progression_id
                          ? "ring-2 ring-error"
                          : ""
                      }`}
                    >
                      <div
                        className={`size-2.5 shrink-0 rounded-full ${healthDot(member.days_in_stage)}`}
                      />
                      <div className="flex flex-1 flex-col">
                        <span className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                          {member.property_id.slice(0, 8)}&hellip;
                          {member.is_own && (
                            <span className="rounded-full bg-brand-primary px-1.5 py-px text-[9px] font-semibold text-white">
                              Yours
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {member.stage.replace(/_/g, " ")} &middot;{" "}
                          {member.days_in_stage}d in stage
                        </span>
                      </div>
                    </div>
                    {idx < detail.members.length - 1 && (
                      <div className="ml-[27px] h-4 w-px bg-neutral-200" />
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
