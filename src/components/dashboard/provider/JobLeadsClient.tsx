"use client";

import { useEffect, useState } from "react";
import type { ProviderLead } from "@/services/provider/provider-job-service";
import { createClient } from "@/lib/supabase/client";
import { JobLeadCard } from "@/components/dashboard/provider/JobLeadCard";
import { Inbox, Bell, Star, Zap } from "lucide-react";

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
// Distance filter pills (presentational)
// ---------------------------------------------------------------------------

const DISTANCE_OPTIONS = ["20 miles", "50 miles", "Custom"] as const;

function DistanceFilters() {
  const [active, setActive] = useState<string>("20 miles");
  return (
    <div className="flex items-center gap-2">
      {DISTANCE_OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => setActive(opt)}
          className={[
            "rounded-full px-3 py-1 text-xs font-medium transition border",
            active === opt
              ? "bg-brand-primary text-white border-brand-primary"
              : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}
      <span className="ml-2 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
        <Bell className="size-3.5 text-brand-primary" />
        Lead Alerts: On
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Daily Lead Credits sidebar widget (presentational)
// ---------------------------------------------------------------------------

function LeadCreditsWidget() {
  return (
    <div className="rounded-xl bg-brand-primary p-5 text-white">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60 mb-1">
        Daily Lead Credits
      </p>
      <div className="flex items-end gap-2">
        <span className="font-heading text-4xl font-bold leading-none">14</span>
        <span className="text-lg font-medium text-white/60 mb-0.5">/20</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/20">
        <div className="h-1.5 w-[70%] rounded-full bg-white" />
      </div>
      <p className="mt-2 text-[11px] text-white/50">Resets at midnight</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Market rank sidebar widget (presentational)
// ---------------------------------------------------------------------------

function MarketRankWidget() {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-neutral-400 mb-3">
        Market Rank
      </p>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold/10">
          <Star className="size-5 fill-brand-gold text-brand-gold" />
        </div>
        <div>
          <p className="text-base font-bold text-neutral-900">Top 5% in Chelsea</p>
          <p className="text-xs text-neutral-500">Your local service ranking</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tips sidebar widget (presentational)
// ---------------------------------------------------------------------------

function QuickTipsWidget() {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="size-4 text-brand-primary" />
        <p className="text-xs font-semibold text-neutral-700">Response tips</p>
      </div>
      <ul className="space-y-2 text-xs text-neutral-500">
        <li className="flex items-start gap-1.5">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/40" />
          Accept within 2 hours for the highest conversion rate.
        </li>
        <li className="flex items-start gap-1.5">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/40" />
          Add a personal message when quoting to stand out.
        </li>
        <li className="flex items-start gap-1.5">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary/40" />
          Urgent leads convert 3× more often than standard ones.
        </li>
      </ul>
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
            serviceCategory:
              (row["service_category"] as string | undefined) ?? "General",
            description: (row["description"] as string | undefined) ?? "",
            location: (row["property_postcode"] as string | undefined) ?? "",
            status: "new",
            budgetMinPence:
              row["budget_min"] != null
                ? Math.round((row["budget_min"] as number) * 100)
                : null,
            budgetMaxPence:
              row["budget_max"] != null
                ? Math.round((row["budget_max"] as number) * 100)
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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content column */}
      <div className="min-w-0 flex-1 space-y-5">
        {/* Toolbar row: category filters + distance pills */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {categories.length > 0 && (
            <FilterTabs
              categories={categories}
              active={activeCategory}
              onChange={setActiveCategory}
            />
          )}
          <DistanceFilters />
        </div>

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
          <div className="space-y-4">
            {/* Hero card — first lead gets the featured treatment */}
            <JobLeadCard
              key={filtered[0].id}
              lead={filtered[0]}
              providerId={providerId}
              onRemove={handleRemove}
              variant="hero"
            />

            {/* Remaining leads in a responsive grid */}
            {filtered.length > 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.slice(1).map((lead) => (
                  <JobLeadCard
                    key={lead.id}
                    lead={lead}
                    providerId={providerId}
                    onRemove={handleRemove}
                    variant="grid"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live indicator */}
        <p className="text-xs text-neutral-400 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          Listening for new leads in real time
        </p>
      </div>

      {/* Sidebar */}
      <aside className="w-full space-y-4 lg:w-64 xl:w-72 shrink-0">
        <LeadCreditsWidget />
        <MarketRankWidget />
        <QuickTipsWidget />
      </aside>
    </div>
  );
}
