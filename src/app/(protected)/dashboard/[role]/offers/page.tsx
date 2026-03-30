"use client";

import { useState } from "react";
import {
  Home,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OfferStatus =
  | "submitted"
  | "solicitors_instructed"
  | "searches"
  | "survey"
  | "mortgage_approved"
  | "exchange"
  | "completion"
  | "withdrawn"
  | "rejected";

type BuyerOffer = Readonly<{
  id: number;
  property_address: string;
  amount_pence: number;
  asking_price_pence: number;
  status: OfferStatus;
  submitted_at: string;
  photo_url: string | null;
}>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<OfferStatus, string> = {
  submitted: "Submitted",
  solicitors_instructed: "Solicitors Instructed",
  searches: "Searches",
  survey: "Survey",
  mortgage_approved: "Mortgage Approved",
  exchange: "Exchange",
  completion: "Completion",
  withdrawn: "Withdrawn",
  rejected: "Rejected",
};

const PROGRESSION: OfferStatus[] = [
  "submitted",
  "solicitors_instructed",
  "searches",
  "survey",
  "mortgage_approved",
  "exchange",
  "completion",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getProgressStep(status: OfferStatus): number {
  const idx = PROGRESSION.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function isTerminal(status: OfferStatus): boolean {
  return status === "withdrawn" || status === "rejected";
}

function isActive(status: OfferStatus): boolean {
  return !isTerminal(status);
}

// ---------------------------------------------------------------------------
// Placeholder data (replaced by real API data in Wave 1)
// ---------------------------------------------------------------------------

const MOCK_OFFERS: BuyerOffer[] = [
  {
    id: 1,
    property_address: "14 Maple Avenue, Bristol, BS1 4JQ",
    amount_pence: 32500000,
    asking_price_pence: 33500000,
    status: "searches",
    submitted_at: "2026-03-01",
    photo_url: null,
  },
  {
    id: 2,
    property_address: "7 Oak Street, Bath, BA1 2AB",
    amount_pence: 45000000,
    asking_price_pence: 44500000,
    status: "submitted",
    submitted_at: "2026-03-10",
    photo_url: null,
  },
  {
    id: 3,
    property_address: "22 Elm Road, Bristol, BS2 6GH",
    amount_pence: 28750000,
    asking_price_pence: 30000000,
    status: "rejected",
    submitted_at: "2026-02-20",
    photo_url: null,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusPill({ status }: Readonly<{ status: OfferStatus }>) {
  const classes = cn(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
    status === "completion" && "bg-emerald-100 text-emerald-700",
    status === "submitted" && "bg-amber-100 text-amber-700",
    (status === "solicitors_instructed" ||
      status === "searches" ||
      status === "survey" ||
      status === "mortgage_approved" ||
      status === "exchange") &&
      "bg-blue-100 text-blue-700",
    status === "withdrawn" && "bg-stone-100 text-stone-500",
    status === "rejected" && "bg-red-100 text-red-600",
  );
  return (
    <span className={classes}>
      {status === "completion" && <CheckCircle2 size={11} />}
      {status === "rejected" && <XCircle size={11} />}
      {STATUS_LABELS[status]}
    </span>
  );
}

function ProgressBar({ status }: Readonly<{ status: OfferStatus }>) {
  if (isTerminal(status)) {
    return <div className="h-1 rounded-full bg-[#e3e2e1]" />;
  }
  const step = getProgressStep(status);
  const pct = Math.round((step / (PROGRESSION.length - 1)) * 100);
  return (
    <div className="h-1 rounded-full bg-[#1B4D3E]/10">
      <div
        className="h-full rounded-full bg-[#1B4D3E] transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function OfferRow({ offer }: Readonly<{ offer: BuyerOffer }>) {
  const priceDiff = offer.amount_pence - offer.asking_price_pence;
  const pricePct = ((priceDiff / offer.asking_price_pence) * 100).toFixed(1);
  const aboveAsking = priceDiff > 0;
  const nextStepIdx = getProgressStep(offer.status) + 1;
  const nextStep =
    !isTerminal(offer.status) && nextStepIdx < PROGRESSION.length
      ? STATUS_LABELS[PROGRESSION[nextStepIdx]]
      : null;

  return (
    <div className="bg-[#faf9f8] rounded-xl p-5 hover:bg-[#f4f3f2] transition-colors">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-lg bg-[#e3e2e1] flex-shrink-0 overflow-hidden">
          {offer.photo_url ? (
            <img
              src={offer.photo_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Home size={20} className="text-[#1a1c1c]/30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-[#1a1c1c] truncate text-sm leading-tight">
                {offer.property_address}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-lg font-bold text-[#1a1c1c]">
                  {formatGBP(offer.amount_pence)}
                </span>
                {!isTerminal(offer.status) && (
                  <span
                    className={cn(
                      "text-xs font-semibold flex items-center gap-0.5",
                      aboveAsking ? "text-emerald-600" : "text-red-500",
                    )}
                  >
                    <TrendingUp
                      size={12}
                      className={aboveAsking ? "" : "rotate-180"}
                    />
                    {aboveAsking ? "+" : ""}
                    {pricePct}% vs asking
                  </span>
                )}
              </div>
            </div>
            <StatusPill status={offer.status} />
          </div>
          <div className="mt-3">
            <ProgressBar status={offer.status} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1 text-xs text-[#1a1c1c]/50">
              <Clock size={11} />
              Submitted {formatDate(offer.submitted_at)}
            </div>
            {nextStep && (
              <span className="text-xs text-[#1B4D3E] font-medium flex items-center gap-1">
                Next: {nextStep}
                <ChevronRight size={12} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type FilterTab = "all" | "active" | "completed";

export default function OffersPage() {
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = MOCK_OFFERS.filter((o) => {
    if (tab === "active") return isActive(o.status) && o.status !== "completion";
    if (tab === "completed")
      return o.status === "completion" || isTerminal(o.status);
    return true;
  });

  const activeCount = MOCK_OFFERS.filter(
    (o) => isActive(o.status) && o.status !== "completion",
  ).length;
  const progressingCount = MOCK_OFFERS.filter(
    (o) => getProgressStep(o.status) > 0 && isActive(o.status),
  ).length;
  const totalValue = MOCK_OFFERS.filter((o) => isActive(o.status)).reduce(
    (acc, o) => acc + o.amount_pence,
    0,
  );

  const tabs: Array<{ key: FilterTab; label: string }> = [
    { key: "all", label: "All offers" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a1c1c] tracking-tight">
          My Offers
        </h1>
        <p className="text-sm text-[#1a1c1c]/60 mt-0.5">
          Track the progress of your submitted offers
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total offers",
            value: String(MOCK_OFFERS.length),
            sub: "submitted",
          },
          { label: "Active", value: String(activeCount), sub: "in progress" },
          {
            label: "In progression",
            value: String(progressingCount),
            sub: "past submission",
          },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-[#faf9f8] rounded-xl p-4">
            <p className="text-xs text-[#1a1c1c]/50 font-medium">{label}</p>
            <p className="text-2xl font-bold text-[#1a1c1c] mt-1">{value}</p>
            <p className="text-xs text-[#1a1c1c]/40 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {activeCount > 0 && (
        <div className="bg-[#1B4D3E] rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Active portfolio value
              </p>
              <p className="text-3xl font-bold mt-1">{formatGBP(totalValue)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
              <TrendingUp size={22} className="text-white" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 bg-[#f4f3f2] rounded-xl p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === key
                ? "bg-white text-[#1a1c1c] shadow-sm"
                : "text-[#1a1c1c]/50 hover:text-[#1a1c1c]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#faf9f8] rounded-2xl">
          <Home size={32} className="mx-auto text-[#1a1c1c]/20 mb-3" />
          <p className="text-[#1a1c1c]/50 text-sm font-medium">
            No offers here yet
          </p>
          <p className="text-[#1a1c1c]/30 text-xs mt-1">
            Start browsing properties to make your first offer
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-[#1B4D3E] text-white text-sm font-semibold hover:bg-[#2D7A5F] transition-colors"
          >
            Browse properties
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((offer) => (
            <OfferRow key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
