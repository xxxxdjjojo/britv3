"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import { ViewingCard } from "@/components/seller/viewings/ViewingCard";
import type { SellerViewing } from "@/types/seller";
import { cn } from "@/lib/utils";

function groupByDate(viewings: SellerViewing[]): Array<{ date: string; items: SellerViewing[] }> {
  const map = new Map<string, SellerViewing[]>();
  for (const v of viewings) {
    const day = v.viewing_datetime.split("T")[0];
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(v);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items }));
}

type ViewMode = "upcoming" | "past";

export default function ManageViewingsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");
  const [viewings, setViewings] = useState<SellerViewing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadViewings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/viewings?filter=${viewMode}`);
      if (!res.ok) throw new Error("Failed to load");
      setViewings(await res.json());
    } catch {
      setViewings([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => { loadViewings(); }, [loadViewings]);

  const grouped = groupByDate(viewings);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 font-['Plus_Jakarta_Sans']">Manage Viewings</h1>
          <p className="text-neutral-500 mt-1">Confirm, reschedule, or cancel property viewings</p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-b border-neutral-200">
        {(["upcoming", "past"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 -mb-px capitalize transition-colors duration-150",
              viewMode === mode ? "border-brand-primary text-brand-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {mode} viewings
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="h-16 w-24 rounded-xl bg-neutral-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-100 rounded w-3/4" />
                  <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  <div className="h-3 bg-neutral-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
          <Calendar size={40} className="text-neutral-200 mx-auto mb-3" />
          <p className="text-neutral-400 text-sm">No {viewMode} viewings</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ date, items }) => (
            <div key={date}>
              <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-3">
                {new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </h2>
              <div className="space-y-3">
                {items.map((viewing) => (
                  <ViewingCard key={viewing.id} viewing={viewing} onUpdated={loadViewings} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
