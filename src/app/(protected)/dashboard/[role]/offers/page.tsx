"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Home,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  FileText,
  MessageSquare,
  History,
  TrendingUp,
  AlertCircle,
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
  doc_count?: number;
  message_count?: number;
  version_count?: number;
}>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<OfferStatus, string> = {
  submitted: "Under Review",
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

const HISTORY_ITEMS = [
  {
    id: "h1",
    title: "Hampshire Estate",
    amount: "£3,200,000",
    date: "Sept 24",
    status: "accepted" as const,
  },
  {
    id: "h2",
    title: "Chelsea Penthouse",
    amount: "£12,500,000",
    date: "Aug 12",
    status: "rejected" as const,
  },
];

const PENDING_TASKS = [
  { id: "t1", done: false, label: "Sign Anti-Money Laundering disclosure" },
  { id: "t2", done: false, label: "Verify source of funds" },
  { id: "t3", done: true, label: "Identity verification completed" },
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
// Mock data (replaced by real API data in production)
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
    doc_count: 3,
    message_count: 12,
    version_count: 4,
  },
  {
    id: 2,
    property_address: "7 Oak Street, Bath, BA1 2AB",
    amount_pence: 45000000,
    asking_price_pence: 44500000,
    status: "submitted",
    submitted_at: "2026-03-10",
    photo_url: null,
    doc_count: 1,
    message_count: 2,
    version_count: 1,
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

function NegotiationProgress({ status }: Readonly<{ status: OfferStatus }>) {
  if (isTerminal(status)) return null;

  const step = getProgressStep(status);
  const stages = ["Sent", "Received", "Countered", "Finalized"] as const;
  const mappedStep = Math.min(Math.floor((step / (PROGRESSION.length - 1)) * 3), 3);
  const progressPct = (mappedStep / 3) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {stages.map((s, i) => (
          <span
            key={s}
            className={cn(
              "text-[10px] font-bold uppercase tracking-tighter",
              i === mappedStep ? "text-brand-primary" : "text-outline",
            )}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="h-0.5 bg-surface-container-low w-full relative">
        <div
          className="absolute h-full bg-brand-primary"
          style={{ width: `${progressPct}%` }}
        />
        {stages.map((_, i) => {
          const pct = (i / (stages.length - 1)) * 100;
          const done = i <= mappedStep;
          return (
            <div
              key={i}
              className={cn(
                "absolute -top-[3px] w-2 h-2 rounded-full",
                done ? "bg-brand-primary" : "bg-surface-container",
                i === mappedStep && "ring-4 ring-primary-container/20",
              )}
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
            />
          );
        })}
      </div>
    </div>
  );
}

function OfferCard({ offer }: Readonly<{ offer: BuyerOffer }>) {
  const isCountered =
    offer.status === "searches" || offer.status === "solicitors_instructed";
  const isUnderReview = offer.status === "submitted";

  const statusBadge = isTerminal(offer.status) ? (
    offer.status === "rejected" ? (
      <span className="bg-error-container text-on-error-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
        Rejected
      </span>
    ) : (
      <span className="bg-surface-container-low text-on-surface-variant px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
        Withdrawn
      </span>
    )
  ) : isCountered ? (
    <span className="bg-secondary-container/30 text-on-secondary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
      Counter-Offer Received
    </span>
  ) : isUnderReview ? (
    <span className="bg-tertiary-container/20 text-on-tertiary-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
      Under Review
    </span>
  ) : (
    <span className="bg-primary-container/20 text-brand-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm">
      {STATUS_LABELS[offer.status]}
    </span>
  );

  return (
    <article className="bg-surface-container-lowest overflow-hidden group shadow-sm hover:shadow-md transition-all rounded-2xl">
      <div className="flex flex-col md:flex-row gap-0 md:gap-8">
        <div className="md:w-1/3 aspect-[4/5] relative overflow-hidden rounded-l-2xl bg-surface-container-low flex-shrink-0">
          {offer.photo_url ? (
            <Image
              src={offer.photo_url}
              alt={offer.property_address}
              fill
              className="object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home size={32} className="text-outline-variant" strokeWidth={1} />
            </div>
          )}
          <div className="absolute top-4 left-4">{statusBadge}</div>
        </div>

        <div className="md:w-2/3 py-6 pr-6 pl-6 md:pl-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-bold tracking-tight text-on-surface font-heading">
                {offer.property_address}
              </h2>
              <span className="text-brand-primary font-bold text-lg flex-shrink-0 ml-4">
                {formatGBP(offer.amount_pence)}
              </span>
            </div>
            <p className="text-outline text-sm mb-6">
              Submitted {formatDate(offer.submitted_at)}
            </p>

            {!isTerminal(offer.status) && (
              <NegotiationProgress status={offer.status} />
            )}

            {!isTerminal(offer.status) && (
              <div className="flex gap-6 items-center mb-6">
                {offer.doc_count !== undefined && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <FileText size={15} strokeWidth={1.25} />
                    <span className="text-[11px] font-medium">
                      {offer.doc_count} Doc{offer.doc_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                {offer.message_count !== undefined && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <MessageSquare size={15} strokeWidth={1.25} />
                    <span className="text-[11px] font-medium">
                      {offer.message_count} Messages
                    </span>
                  </div>
                )}
                {offer.version_count !== undefined && (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <History size={15} strokeWidth={1.25} />
                    <span className="text-[11px] font-medium">
                      {offer.version_count} Version
                      {offer.version_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-outline-variant/20">
            {isCountered && (
              <Link
                href={`/dashboard/homebuyer/offers/${offer.id}`}
                className="bg-brand-primary text-white px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide hover:opacity-90 transition-colors"
              >
                Respond to Counter
              </Link>
            )}
            {!isTerminal(offer.status) && (
              <Link
                href={`/dashboard/homebuyer/offers/${offer.id}`}
                className="text-on-surface border border-outline-variant px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide hover:bg-surface-container-low transition-colors"
              >
                View Documents
              </Link>
            )}
            {isUnderReview && (
              <Link
                href={`/dashboard/homebuyer/offers/${offer.id}`}
                className="text-on-surface border border-outline-variant px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wide hover:bg-surface-container-low transition-colors"
              >
                Edit Offer
              </Link>
            )}
            <Link
              href={`/dashboard/homebuyer/offers/${offer.id}`}
              className="text-outline px-3 py-2.5 text-xs font-semibold tracking-wide hover:text-on-surface transition-colors flex items-center gap-1"
            >
              Details
              <ChevronRight size={12} strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </article>
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
    <div className="space-y-12">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface">
            Active Proposals
          </h1>
          <p className="text-on-surface-variant text-base mt-2 leading-relaxed max-w-xl">
            Manage your property acquisitions and track real-time negotiation
            progress.
          </p>
        </div>
        <button
          type="button"
          className="bg-brand-primary hover:opacity-90 text-white px-8 py-4 rounded-lg font-heading font-semibold text-sm transition-all shadow-lg flex items-center gap-2 self-start md:self-auto flex-shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          Submit New Offer
        </button>
      </header>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 items-start">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 w-fit">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  tab === key
                    ? "bg-surface-container-lowest text-on-surface shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-surface-container-lowest rounded-2xl shadow-sm">
              <Home
                size={32}
                strokeWidth={1.25}
                className="mx-auto text-outline-variant mb-3"
              />
              <p className="text-on-surface-variant text-sm font-medium">
                No offers here yet
              </p>
              <p className="text-outline text-xs mt-1">
                Start browsing properties to make your first offer
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:opacity-90 transition-colors"
              >
                Browse properties
                <ArrowRight size={15} strokeWidth={1.25} />
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {filtered.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="space-y-10">
          {/* Market Insight */}
          <section className="bg-brand-primary text-white p-8 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp
                  size={20}
                  className="text-secondary-container"
                  strokeWidth={1.5}
                />
                <h3 className="text-lg font-bold tracking-tight">
                  Market Insight
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-white/80 mb-6">
                Your current offers are{" "}
                <span className="text-white font-bold">
                  4.2% more competitive
                </span>{" "}
                than the average for similar listings this quarter.
              </p>
              <div className="flex flex-col gap-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
                    Inventory Trend
                  </p>
                  <p className="text-xs font-medium text-white">
                    Supply decreasing by 12%. Urgency recommended.
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
                    Interest Rate Impact
                  </p>
                  <p className="text-xs font-medium text-white">
                    Stable through Q4. High-value transactions up by 8%.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Active portfolio value */}
          {activeCount > 0 && (
            <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-outline font-bold mb-1">
                Active Portfolio Value
              </p>
              <p className="text-3xl font-bold text-brand-primary">
                {formatGBP(totalValue)}
              </p>
            </section>
          )}

          {/* Recent history */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-on-surface">
                Recent History
              </h3>
              <button
                type="button"
                className="text-[11px] font-bold text-brand-primary hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-5">
              {HISTORY_ITEMS.map((h) => (
                <div key={h.id} className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-surface-container-low shrink-0 overflow-hidden rounded-lg flex items-center justify-center">
                    <Home
                      size={20}
                      className="text-outline-variant"
                      strokeWidth={1}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-on-surface truncate pr-2">
                        {h.title}
                      </h4>
                      <span
                        className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 flex-shrink-0",
                          h.status === "accepted"
                            ? "text-brand-primary bg-primary-container/20"
                            : "text-error bg-error-container/20",
                        )}
                      >
                        {h.status === "accepted" ? "Accepted" : "Declined"}
                      </span>
                    </div>
                    <p className="text-[10px] text-outline mb-1.5">
                      {h.amount} · {h.date}
                    </p>
                    <button
                      type="button"
                      className="text-[9px] font-bold text-outline hover:text-brand-primary flex items-center gap-1 uppercase tracking-widest transition-colors"
                    >
                      Archive Details
                      <ChevronRight size={11} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pending tasks */}
          <section className="bg-surface-container-low p-6 rounded-xl">
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-4">
              Pending Tasks
            </h3>
            <ul className="space-y-3">
              {PENDING_TASKS.map((task) => (
                <li
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 text-xs font-medium",
                    task.done
                      ? "text-outline line-through"
                      : "text-on-surface",
                  )}
                >
                  {task.done ? (
                    <CheckCircle2
                      size={14}
                      className="text-brand-primary flex-shrink-0"
                    />
                  ) : (
                    <AlertCircle
                      size={14}
                      className="text-secondary-fixed-dim flex-shrink-0"
                      strokeWidth={1.5}
                    />
                  )}
                  {task.label}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
