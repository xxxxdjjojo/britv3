"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { ChainDetail, ChainRiskLevel } from "@/types/agent";

const RISK_COLOURS: Record<ChainRiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const HEALTH_DOT: Record<string, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch loading toggle
    setLoading(true);
    fetch(`/api/agent/sales/chain?groupId=${encodeURIComponent(chainGroupId)}`)
      .then((res) => res.json())
      .then((data: ChainDetail) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [open, chainGroupId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Property Chain</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading chain...</p>
        ) : !detail ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No chain data available.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{detail.total_length} links</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_COLOURS[detail.risk_level]}`}>
                {detail.risk_level} risk ({detail.risk_score}/100)
              </span>
            </div>

            {/* Chain diagram */}
            <div className="flex flex-col gap-0">
              {detail.members
                .sort((a, b) => a.position - b.position)
                .map((member, idx) => (
                  <div key={member.progression_id}>
                    <div
                      className={`flex items-center gap-3 rounded-lg border p-3 ${
                        member.is_own ? "border-brand-primary bg-brand-primary/5" : ""
                      } ${
                        detail.slowest_member?.progression_id === member.progression_id
                          ? "ring-2 ring-red-400"
                          : ""
                      }`}
                    >
                      <div className={`size-2.5 shrink-0 rounded-full ${healthDot(member.days_in_stage)}`} />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {member.property_id.slice(0, 8)}&hellip;
                          {member.is_own && (
                            <Badge variant="secondary" className="ml-2 text-[9px]">Yours</Badge>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {member.stage.replace(/_/g, " ")} &middot; {member.days_in_stage}d
                        </span>
                      </div>
                    </div>
                    {idx < detail.members.length - 1 && (
                      <div className="ml-[11px] h-4 w-px bg-border" />
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
