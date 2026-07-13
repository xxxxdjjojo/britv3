"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * Tier-1 action panel (production-support PR 8). Renders the audited remediation
 * actions available for a target (user or billing event). Every run is a two-step
 * flow: preview (dry run, Recommend mode) → confirm → execute. High-risk actions
 * require an explicit approval click. The panel never receives or displays any
 * secret/link — sensitive output is emailed out-of-band by the action itself.
 */

export type Tier1ActionDescriptor = Readonly<{
  key: string;
  label: string;
  description: string;
  risk: "low" | "medium" | "high";
  reversible: boolean;
}>;

type PreviewData = {
  summary: string;
  effects: string[];
  reversible: boolean;
  requiresApproval: boolean;
  blockers?: string[];
};

const RISK_TONE: Record<Tier1ActionDescriptor["risk"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export function Tier1ActionsPanel({
  actions,
  targetId,
  ticketId,
}: Readonly<{
  actions: readonly Tier1ActionDescriptor[];
  targetId: string;
  ticketId?: string;
}>) {
  const router = useRouter();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [busy, setBusy] = useState(false);

  if (actions.length === 0) return null;

  async function dispatch(actionKey: string, mode: "preview" | "execute") {
    const res = await fetch("/api/admin/tier1-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionKey, targetId, mode, ticketId }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error((data.error as string) ?? `Request failed (${res.status})`);
    return data;
  }

  async function handlePreview(actionKey: string) {
    setBusy(true);
    setPreview(null);
    setOpenKey(actionKey);
    try {
      const data = await dispatch(actionKey, "preview");
      setPreview(data.preview as PreviewData);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
      setOpenKey(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleExecute(actionKey: string) {
    setBusy(true);
    try {
      const data = await dispatch(actionKey, "execute");
      toast.success((data.summary as string) ?? "Action completed");
      setOpenKey(null);
      setPreview(null);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const isOpen = openKey === action.key;
        const blocked = isOpen && (preview?.blockers?.length ?? 0) > 0;
        return (
          <div key={action.key} className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-neutral-900">{action.label}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{action.description}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${RISK_TONE[action.risk]}`}>
                {action.risk}
              </span>
            </div>

            {!isOpen ? (
              <button
                type="button"
                onClick={() => handlePreview(action.key)}
                disabled={busy}
                className="mt-2 rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
              >
                Preview
              </button>
            ) : (
              <div className="mt-3 rounded-md bg-neutral-50 p-3">
                {preview ? (
                  <>
                    <p className="text-xs font-medium text-neutral-800">{preview.summary}</p>
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-neutral-600">
                      {preview.effects.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                    {preview.blockers && preview.blockers.length > 0 ? (
                      <ul className="mt-2 space-y-0.5 text-xs font-medium text-red-700">
                        {preview.blockers.map((b) => (
                          <li key={b}>⚠ {b}</li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleExecute(action.key)}
                        disabled={busy || blocked}
                        className="rounded-md bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        {preview.requiresApproval ? "Approve & run" : "Run action"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenKey(null);
                          setPreview(null);
                        }}
                        disabled={busy}
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-white disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-neutral-500">Loading preview…</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
