"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Generate + display the redacted triage packet for a ticket (PR 9). The packet
 * is produced server-side through the audited route; this component only renders
 * the already-redacted markdown and offers a copy button. It never sees raw
 * customer data.
 */
export function TriagePacketButton({ ticketId }: Readonly<{ ticketId: string }>) {
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleGenerate() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}/triage-packet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error((data.error as string) ?? `Request failed (${res.status})`);
      setMarkdown((data.markdown as string) ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate packet");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("Packet copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={busy}
        className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
      >
        {busy ? "Generating…" : "Generate triage packet"}
      </button>

      {markdown !== null && (
        <div className="rounded-md border border-neutral-200 bg-neutral-50">
          <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
              Redacted · Recommend mode
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-medium text-brand-primary hover:underline"
            >
              Copy
            </button>
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap px-3 py-2 text-[11px] leading-relaxed text-neutral-700">
            {markdown}
          </pre>
        </div>
      )}
    </div>
  );
}
