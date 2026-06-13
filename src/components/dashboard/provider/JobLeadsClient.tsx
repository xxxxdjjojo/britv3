"use client";

import { useEffect, useState } from "react";
import type { ProviderLead } from "@/services/provider/provider-job-service";
import { createClient } from "@/lib/supabase/client";
import { JobLeadCard } from "@/components/dashboard/provider/JobLeadCard";
import { Inbox } from "lucide-react";

// ---------------------------------------------------------------------------
// Category filter tabs
// ---------------------------------------------------------------------------

function FilterTabs(props: Readonly<{
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}>) {
  const tabs = ["All", ...props.categories];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => props.onChange(tab)}
          className={[
            "rounded-full px-4 py-1.5 text-sm font-medium transition",
            props.active === tab
              ? "bg-brand-primary text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
          ].join(" ")}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// JobLeadsClient
// ---------------------------------------------------------------------------

type JobLeadsClientProps = Readonly<{
  initialLeads: ProviderLead[];
  providerId: string;
}>;

export function JobLeadsClient({ initialLeads, providerId }: JobLeadsClientProps) {
  const [leads, setLeads] = useState<ProviderLead[]>(initialLeads);
  const [activeCategory, setActiveCategory] = useState("All");

  // Derive unique category list from leads
  const categories = Array.from(new Set(leads.map((l) => l.serviceCategory))).sort();

  // Reset filter if the active category is removed after lead removal
  useEffect(() => {
    if (activeCategory !== "All" && !categories.includes(activeCategory)) {
      setActiveCategory("All");
    }
  }, [categories, activeCategory]);

  // Supabase Realtime — listen for new service_requests
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("provider-leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_requests" },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          // Only add if status is open (new leads arrive as open)
          if (row["status"] !== "open") return;

          const createdAt = (row["created_at"] as string | undefined) ?? new Date().toISOString();
          const expiresAt = new Date(
            new Date(createdAt).getTime() + 48 * 60 * 60 * 1000,
          ).toISOString();

          const newLead: ProviderLead = {
            id: row["id"] as string,
            clientName: "Client",
            serviceCategory: (row["category"] as string | undefined) ?? "General",
            description: (row["description"] as string | undefined) ?? "",
            location: (row["postcode"] as string | undefined) ?? "",
            status: "new",
            budgetMinPence:
              row["budget_range_min"] != null
                ? Math.round((row["budget_range_min"] as number) * 100)
                : null,
            budgetMaxPence:
              row["budget_range_max"] != null
                ? Math.round((row["budget_range_max"] as number) * 100)
                : null,
            createdAt,
            expiresAt,
          };

          setLeads((prev) => [newLead, ...prev]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  function handleRemove(leadId: string) {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
  }

  const filtered =
    activeCategory === "All"
      ? leads
      : leads.filter((l) => l.serviceCategory === activeCategory);

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      {categories.length > 0 && (
        <FilterTabs
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      )}

      {/* Lead cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-surface py-16 text-center">
          <Inbox className="size-10 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-500">No leads right now</p>
          <p className="mt-1 text-xs text-neutral-400">
            New leads matching your service categories will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lead) => (
            <JobLeadCard
              key={lead.id}
              lead={lead}
              providerId={providerId}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      {/* Live indicator */}
      <p className="text-xs text-neutral-400 flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        Listening for new leads in real time
      </p>
    </div>
  );
}
