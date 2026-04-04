"use client";

import { useEffect, useState } from "react";
import type { ProviderLead } from "@/services/provider/provider-job-service";
import { createClient } from "@/lib/supabase/client";
import { JobLeadCard } from "@/components/dashboard/provider/JobLeadCard";
import { Inbox, Bell, Trophy, Zap, RefreshCw } from "lucide-react";

// ---------------------------------------------------------------------------
// Radius filter toggle
// ---------------------------------------------------------------------------

type RadiusOption = "25mi" | "50mi" | "Custom";
const RADIUS_OPTIONS: RadiusOption[] = ["25mi", "50mi", "Custom"];

function RadiusToggle(props: Readonly<{
  active: RadiusOption;
  onChange: (r: RadiusOption) => void;
}>) {
  return (
    <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-neutral-200">
      {RADIUS_OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => props.onChange(opt)}
          className={[
            "px-4 py-1.5 text-xs font-semibold rounded-lg transition-all",
            props.active === opt
              ? "bg-brand-primary text-white"
              : "text-neutral-500 hover:text-neutral-800",
          ].join(" ")}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

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
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => props.onChange(tab)}
          className={[
            "rounded-full px-4 py-1.5 text-sm font-semibold transition",
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
// Featured Lead Card (large emergency-style card for the first lead)
// ---------------------------------------------------------------------------

function FeaturedLeadCard(props: Readonly<{
  lead: ProviderLead;
  providerId: string;
  onRemove: (id: string) => void;
}>) {
  const { lead } = props;
  const isUrgent = lead.serviceCategory.toLowerCase().includes("emergency") ||
    lead.serviceCategory.toLowerCase().includes("urgent");

  function formatBudget(minPence: number | null, maxPence: number | null): string {
    if (minPence == null && maxPence == null) return "Budget TBC";
    const fmt = (p: number) => `£${(p / 100).toLocaleString("en-GB")}`;
    if (minPence != null && maxPence != null) return `${fmt(minPence)} - ${fmt(maxPence)}`;
    if (minPence != null) return `From ${fmt(minPence)}`;
    return `Up to ${fmt(maxPence!)}`;
  }

  return (
    <article className="lg:col-span-8 group relative overflow-hidden bg-white rounded-2xl border border-error/30 shadow-xl shadow-error/5 hover:shadow-2xl transition-all p-1">
      <div className={["absolute top-0 left-0 w-2 h-full rounded-l-2xl", isUrgent ? "bg-error" : "bg-brand-primary"].join(" ")} />
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className={["px-3 py-1 text-white text-[10px] font-bold tracking-widest uppercase rounded-full", isUrgent ? "bg-error" : "bg-brand-primary"].join(" ")}>
              {isUrgent ? "EMERGENCY" : "NEW LEAD"}
            </span>
            <span className="px-3 py-1 bg-brand-primary-lighter text-brand-primary text-[10px] font-bold tracking-widest uppercase rounded-full">
              TOP MATCH
            </span>
          </div>
          <p className="text-sm font-medium text-neutral-400">
            {relativeTime(lead.createdAt)}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h4 className="text-2xl font-bold font-heading text-neutral-900 mb-2">
              {lead.serviceCategory}
            </h4>
            <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
              <span className="flex items-center gap-1.5">
                <span className="text-brand-primary">📍</span>
                {lead.location || "Location TBC"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-brand-secondary">💷</span>
                Est. Budget: {formatBudget(lead.budgetMinPence, lead.budgetMaxPence)}
              </span>
            </div>
            {lead.description && (
              <p className="mt-3 text-sm text-neutral-500 line-clamp-2">{lead.description}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => props.onRemove(lead.id)}
              className="px-6 py-2.5 bg-brand-primary text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 text-sm"
            >
              View Details
            </button>
            <button
              className="p-2.5 border border-neutral-200 text-neutral-400 hover:text-error hover:bg-error-light rounded-xl transition-all"
              aria-label="Dismiss lead"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function relativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
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
  const [activeRadius, setActiveRadius] = useState<"25mi" | "50mi" | "Custom">("25mi");
  const [creditsUsed] = useState(Math.min(leads.length, 14));
  const creditsTotal = 20;

  // Derive unique category list from leads
  const categories = Array.from(new Set(leads.map((l) => l.serviceCategory))).sort();

  // If the active category no longer exists in the list, fall back to "All"
  const effectiveCategory =
    activeCategory === "All" || categories.includes(activeCategory)
      ? activeCategory
      : "All";

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
    effectiveCategory === "All"
      ? leads
      : leads.filter((l) => l.serviceCategory === effectiveCategory);

  const [featuredLead, ...remainingLeads] = filtered;

  if (filtered.length === 0) {
    return (
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <RadiusToggle active={activeRadius} onChange={setActiveRadius} />
            <button className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-xl bg-white text-sm font-medium hover:bg-neutral-50 transition-colors">
              <Bell className="size-4" />
              Lead Alerts: On
            </button>
          </div>
        </div>

        {categories.length > 0 && (
          <FilterTabs categories={categories} active={effectiveCategory} onChange={setActiveCategory} />
        )}

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-16 text-center">
          <Inbox className="size-10 text-neutral-300" />
          <p className="mt-3 text-sm font-medium text-neutral-500">No leads right now</p>
          <p className="mt-1 text-xs text-neutral-400">
            New leads matching your service categories will appear here automatically.
          </p>
        </div>

        <p className="text-xs text-neutral-400 flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
          Listening for new leads in real time
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Controls Bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {categories.length > 0 && (
          <FilterTabs categories={categories} active={effectiveCategory} onChange={setActiveCategory} />
        )}
        <div className="flex items-center gap-3 shrink-0">
          <RadiusToggle active={activeRadius} onChange={setActiveRadius} />
          <button className="flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-xl bg-white text-sm font-medium hover:bg-neutral-50 transition-colors">
            <Bell className="size-4" />
            Lead Alerts: On
          </button>
        </div>
      </div>

      {/* ── Leads Bento Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Featured Lead (large) */}
        {featuredLead && (
          <FeaturedLeadCard
            lead={featuredLead}
            providerId={providerId}
            onRemove={handleRemove}
          />
        )}

        {/* Sidebar Stats */}
        <aside className="lg:col-span-4 grid grid-rows-2 gap-6">
          {/* Lead Credits Card */}
          <div className="bg-brand-primary text-white rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
              <p className="text-success-light text-sm font-medium">Daily Lead Credits</p>
              <h5 className="text-4xl font-bold font-heading">{creditsUsed}/{creditsTotal}</h5>
              <div className="w-full bg-success h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all"
                  style={{ width: `${(creditsUsed / creditsTotal) * 100}%` }}
                />
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Zap className="size-24" />
            </div>
          </div>

          {/* Market Rank Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-light flex items-center justify-center">
              <Trophy className="size-5 text-brand-secondary" />
            </div>
            <div>
              <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Market Rank</p>
              <h5 className="text-lg font-bold text-neutral-900">Top Provider</h5>
            </div>
          </div>
        </aside>

        {/* Remaining leads as row cards */}
        {remainingLeads.map((lead) => (
          <article
            key={lead.id}
            className="lg:col-span-12 bg-white border border-neutral-200 rounded-2xl hover:border-brand-primary/30 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <JobLeadCard
              lead={lead}
              providerId={providerId}
              onRemove={handleRemove}
              layout="row"
            />
          </article>
        ))}
      </div>

      {/* ── Load More ─────────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-2">
        <button className="flex items-center gap-2 px-8 py-3 bg-white border border-neutral-200 rounded-full font-bold text-sm text-neutral-700 hover:shadow-md transition-all">
          <RefreshCw className="size-4" />
          Load More Opportunities
        </button>
      </div>

      {/* Live indicator */}
      <p className="text-xs text-neutral-400 flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
        Listening for new leads in real time
      </p>
    </div>
  );
}
