"use client";

import { useState } from "react";

import { PLACEMENT_TYPE_LABELS } from "@/types/sponsored-placements";
import type { AdminPlacementRow } from "@/services/placements/placement-admin-service";

type Props = Readonly<{
  initialPlacements: AdminPlacementRow[];
  revenuePence: number;
}>;

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB")}`;
}

function targeting(p: AdminPlacementRow): string {
  return p.postcode_district ?? p.town ?? p.region_scope ?? "Nationwide";
}

export function AdminPlacementsClient({ initialPlacements, revenuePence }: Props) {
  const [placements, setPlacements] = useState(initialPlacements);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/placements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // Optimistically reflect the new status locally.
        setPlacements((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...localPatch(body) } : p)),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Monthly ad revenue" value={formatGBP(revenuePence)} />
        <Stat label="Active" value={String(placements.filter((p) => p.status === "active").length)} />
        <Stat label="Pending review" value={String(placements.filter((p) => p.status === "pending_review").length)} />
        <Stat label="Total" value={String(placements.length)} />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Advertiser</th>
              <th className="px-4 py-3">Placement</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Impr.</th>
              <th className="px-4 py-3">Enq.</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {placements.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {p.service_provider_details?.business_name ?? p.provider_id.slice(0, 8)}
                </td>
                <td className="px-4 py-3">{PLACEMENT_TYPE_LABELS[p.placement_type]}</td>
                <td className="px-4 py-3 text-muted-foreground">{targeting(p)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                    {p.status.replace(/_/g, " ")}
                  </span>
                  {p.admin_featured && <span className="ml-1 text-[10px] font-semibold text-amber-600">★ featured</span>}
                </td>
                <td className="px-4 py-3 tabular-nums">{p.impressions_count}</td>
                <td className="px-4 py-3 tabular-nums">{p.enquiries_count}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {p.status === "pending_review" && (
                      <ActionButton disabled={busyId === p.id} onClick={() => act(p.id, { action: "approve" })}>
                        Approve
                      </ActionButton>
                    )}
                    {p.status !== "rejected" && (
                      <ActionButton
                        variant="danger"
                        disabled={busyId === p.id}
                        onClick={() => act(p.id, { action: "reject", reason: "Rejected by admin" })}
                      >
                        Reject
                      </ActionButton>
                    )}
                    {p.status === "active" && (
                      <ActionButton disabled={busyId === p.id} onClick={() => act(p.id, { action: "pause" })}>
                        Pause
                      </ActionButton>
                    )}
                    {p.status === "paused" && (
                      <ActionButton disabled={busyId === p.id} onClick={() => act(p.id, { action: "resume" })}>
                        Resume
                      </ActionButton>
                    )}
                    <ActionButton
                      disabled={busyId === p.id}
                      onClick={() => act(p.id, { action: "feature", featured: !p.admin_featured })}
                    >
                      {p.admin_featured ? "Unfeature" : "Feature"}
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
            {placements.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No placements yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function localPatch(body: Record<string, unknown>): Partial<AdminPlacementRow> {
  switch (body.action) {
    case "approve":
    case "resume":
      return { status: "active" };
    case "reject":
      return { status: "rejected" };
    case "pause":
      return { status: "paused" };
    case "feature":
      return { admin_featured: Boolean(body.featured) };
    default:
      return {};
  }
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "default",
}: Readonly<{ children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: "default" | "danger" }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2 py-1 text-xs font-medium disabled:opacity-50 ${
        variant === "danger" ? "border-red-200 text-red-700 hover:bg-red-50" : "hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
