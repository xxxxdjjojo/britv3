"use client";

import { useState, useTransition } from "react";
import type { FeatureFlag } from "@/services/admin/feature-flag-service";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = Readonly<{ flags: FeatureFlag[] }>;

function FlagRow({ flag }: { flag: FeatureFlag }) {
  const router = useRouter();
  const [toggling, startToggle] = useTransition();
  const [savingRollout, startRollout] = useTransition();
  const [pendingRollout, setPendingRollout] = useState<number | null>(null);

  const displayPct = pendingRollout ?? flag.rollout_pct;
  const isDirty = pendingRollout !== null && pendingRollout !== flag.rollout_pct;

  function handleToggle(enabled: boolean) {
    startToggle(async () => {
      try {
        const res = await fetch(
          `/api/admin/feature-flags/${encodeURIComponent(flag.key)}/toggle`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ enabled }),
          },
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "Failed to toggle flag");
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to toggle flag");
      }
    });
  }

  function handleSaveRollout() {
    const pct = pendingRollout ?? flag.rollout_pct;
    startRollout(async () => {
      try {
        const res = await fetch(
          `/api/admin/feature-flags/${encodeURIComponent(flag.key)}/rollout`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pct }),
          },
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? "Failed to set rollout");
        }
        setPendingRollout(null);
        router.refresh();
        toast.success("Rollout updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to set rollout");
      }
    });
  }

  return (
    <div className="rounded-xl bg-card p-5 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-body text-sm font-medium text-foreground">
              {flag.key}
            </span>
            {flag.allowed_roles && flag.allowed_roles.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {flag.allowed_roles.map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-brand-primary-lighter px-2 py-0.5 font-body text-xs font-medium text-brand-primary"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
          {flag.description && (
            <p className="font-body text-xs text-neutral-500 mb-3">{flag.description}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="font-body text-xs text-neutral-500 w-20">
              Rollout: {displayPct}%
            </span>
            <div className="flex-1 max-w-xs">
              <Slider
                min={0}
                max={100}
                step={1}
                value={[displayPct]}
                onValueChange={(v) => setPendingRollout(Array.isArray(v) ? v[0] ?? flag.rollout_pct : v)}
                disabled={toggling}
                className="cursor-pointer"
              />
            </div>
            {isDirty && (
              <Button
                size="sm"
                onClick={handleSaveRollout}
                disabled={savingRollout}
                className="rounded-lg bg-brand-primary px-3 py-1.5 font-body text-xs font-medium text-white hover:bg-brand-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2 h-auto"
              >
                {savingRollout ? "Saving…" : "Save"}
              </Button>
            )}
          </div>
          <p className="font-body text-xs text-neutral-400 mt-2">
            Last updated:{" "}
            {new Date(flag.updated_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Switch
          checked={flag.enabled}
          onCheckedChange={handleToggle}
          disabled={toggling}
          aria-label={`Toggle ${flag.key}`}
        />
      </div>
    </div>
  );
}

export function FeatureFlagsClient({ flags }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-body text-sm text-neutral-500">
          {flags.length} flag{flags.length !== 1 ? "s" : ""}
        </span>
        <span className="font-body text-sm text-neutral-500">
          {flags.filter((f) => f.enabled).length} enabled
        </span>
      </div>
      {flags.map((flag) => (
        <FlagRow key={flag.key} flag={flag} />
      ))}
    </div>
  );
}
