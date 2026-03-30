
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  PoundSterling,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Landmark,
  Scale,
  Search,
  HandCoins,
  PartyPopper,
} from "lucide-react";
import { penceToGBP } from "@/lib/currency";
import Link from "next/link";

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
  property_image?: string;
  agent_name?: string;
  amount_pence: number;
  asking_pence: number;
  status: OfferStatus;
  submitted_at: string;
}>;

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

type StatusConfig = {
  label: string;
  description: string;
  badgeClass: string;
  iconClass: string;
};

const STATUS_CONFIG: Record<OfferStatus, StatusConfig> = {
  submitted: {
    label: "Submitted",
    description: "Offer sent to the seller",
    badgeClass: "bg-info-light text-info border-0",
    iconClass: "text-info",
  },
  solicitors_instructed: {
    label: "Solicitors Instructed",
    description: "Legal work has begun",
    badgeClass: "bg-brand-primary-lighter text-brand-primary border-0",
    iconClass: "text-brand-primary",
  },
  searches: {
    label: "Searches",
    description: "Local authority searches underway",
    badgeClass: "bg-brand-primary-lighter text-brand-primary border-0",
    iconClass: "text-brand-primary",
  },
  survey: {
    label: "Survey",
    description: "Property survey in progress",
    badgeClass: "bg-brand-primary-lighter text-brand-primary border-0",
    iconClass: "text-brand-primary",
  },
  mortgage_approved: {
    label: "Mortgage Approved",
    description: "Mortgage formally approved",
    badgeClass: "bg-success-light text-success border-0",
    iconClass: "text-success",
  },
  exchange: {
    label: "Exchange",
    description: "Contracts exchanged",
    badgeClass: "bg-success-light text-success border-0",
    iconClass: "text-success",
  },
  completion: {
    label: "Completed",
    description: "Congratulations — sale complete!",
    badgeClass: "bg-success-light text-success border-0",
    iconClass: "text-success",
  },
  withdrawn: {
    label: "Withdrawn",
    description: "You withdrew this offer",
    badgeClass: "bg-neutral-100 text-neutral-600 border-0",
    iconClass: "text-neutral-400",
  },
  rejected: {
    label: "Rejected",
    description: "Seller declined this offer",
    badgeClass: "bg-error-light text-error border-0",
    iconClass: "text-error",
  },
};

// ---------------------------------------------------------------------------
// Progression pipeline
// ---------------------------------------------------------------------------

const PIPELINE: OfferStatus[] = [
  "submitted",
  "solicitors_instructed",
  "searches",
  "survey",
  "mortgage_approved",
  "exchange",
  "completion",
];

const PIPELINE_ICONS: Record<OfferStatus, React.ComponentType<{ className?: string }>> = {
  submitted: FileText,
  solicitors_instructed: Scale,
  searches: Search,
  survey: Home,
  mortgage_approved: Landmark,
  exchange: HandCoins,
  completion: PartyPopper,
  withdrawn: XCircle,
  rejected: XCircle,
};

function getProgressPercent(status: OfferStatus): number {
  const idx = PIPELINE.indexOf(status);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / PIPELINE.length) * 100);
}

function getNextStep(status: OfferStatus): string {
  const idx = PIPELINE.indexOf(status);
  if (idx === -1) return "";
  if (idx === PIPELINE.length - 1) return "Sale complete — congratulations!";
  const next = PIPELINE[idx + 1];
  return `Next: ${STATUS_CONFIG[next].label}`;
}

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const offers: BuyerOffer[] = [
  {
    id: 1,
    property_address: "14 Maple Avenue, Bristol, BS1 4JQ",
    agent_name: "Sarah Jones",
    amount_pence: 32500000,
    asking_pence: 34000000,
    status: "searches",
    submitted_at: "2026-03-01",
  },
  {
    id: 2,
    property_address: "7 Oak Street, Bath, BA1 2AB",
    agent_name: "David Chen",
    amount_pence: 45000000,
    asking_pence: 45000000,
    status: "submitted",
    submitted_at: "2026-03-10",
  },
  {
    id: 3,
    property_address: "22 Elm Road, Bristol, BS2 6GH",
    agent_name: "Emma Wilson",
    amount_pence: 28750000,
    asking_pence: 31500000,
    status: "rejected",
    submitted_at: "2026-02-20",
  },
];

// ---------------------------------------------------------------------------
// Derived stats
// ---------------------------------------------------------------------------

const activeOffers = offers.filter(
  (o) => o.status !== "withdrawn" && o.status !== "rejected",
);
const progressingOffers = offers.filter((o) => PIPELINE.indexOf(o.status) > 0);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function OfferCard({ offer }: Readonly<{ offer: BuyerOffer }>) {
  const config = STATUS_CONFIG[offer.status];
  const progress = getProgressPercent(offer.status);
  const nextStep = getNextStep(offer.status);
  const isTerminal = offer.status === "rejected" || offer.status === "withdrawn";
  const isCompleted = offer.status === "completion";
  const offerGBP = penceToGBP(offer.amount_pence);
  const askingGBP = penceToGBP(offer.asking_pence);
  const diffPct = Math.round(((offerGBP - askingGBP) / askingGBP) * 100);

  return (
    <div
      className={`rounded-2xl bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${
        isTerminal ? "opacity-70" : ""
      }`}
    >
      {/* Top: address + badge */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50">
            <Home className="size-5 stroke-[1.25] text-brand-primary" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">
              {offer.property_address}
            </p>
            {offer.agent_name && (
              <p className="text-xs text-neutral-500">Agent: {offer.agent_name}</p>
            )}
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}
        >
          {config.label}
        </span>
      </div>

      {/* Offer amount */}
      <div className="mb-4 flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs text-neutral-500">Your Offer</p>
          <p className="flex items-center gap-1 text-xl font-bold text-neutral-900">
            <PoundSterling className="size-4 stroke-[1.25]" />
            {offerGBP.toLocaleString("en-GB")}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Asking Price</p>
          <p className="text-sm font-medium text-neutral-600">
            £{askingGBP.toLocaleString("en-GB")}
          </p>
        </div>
        {diffPct !== 0 && (
          <div>
            <p className="text-xs text-neutral-500">vs Asking</p>
            <p
              className={`text-sm font-medium ${
                diffPct < 0 ? "text-warning" : "text-success"
              }`}
            >
              {diffPct > 0 ? "+" : ""}
              {diffPct}%
            </p>
          </div>
        )}
        <div className="ml-auto text-right">
          <p className="text-xs text-neutral-500">Submitted</p>
          <p className="flex items-center gap-1 text-sm text-neutral-600">
            <Clock className="size-3.5 stroke-[1.25]" />
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(offer.submitted_at))}
          </p>
        </div>
      </div>

      {/* Progress bar (active offers only) */}
      {!isTerminal && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-600">
              {isCompleted ? "Sale complete!" : nextStep}
            </p>
            <p className="text-xs text-neutral-400">{progress}%</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCompleted ? "bg-success" : "bg-brand-primary"
              }`}
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Offer progress: ${progress}%`}
            />
          </div>
        </div>
      )}

      {/* Terminal state message */}
      {isTerminal && (
        <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
          {config.description}
        </p>
      )}

      {/* Pipeline steps (active offers) */}
      {!isTerminal && !isCompleted && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {PIPELINE.map((step, idx) => {
            const currentIdx = PIPELINE.indexOf(offer.status);
            const isDone = idx <= currentIdx;
            const Icon = PIPELINE_ICONS[step];
            return (
              <div
                key={step}
                className="flex shrink-0 flex-col items-center gap-1"
                title={STATUS_CONFIG[step].label}
              >
                <div
                  className={`flex size-7 items-center justify-center rounded-full transition-colors ${
                    isDone
                      ? "bg-brand-primary text-white"
                      : "bg-neutral-100 text-neutral-300"
                  }`}
                >
                  {isDone ? (
                    idx === currentIdx ? (
                      <Icon className="size-3.5" />
                    ) : (
                      <CheckCircle2 className="size-3.5" />
                    )
                  ) : (
                    <Icon className="size-3.5" />
                  )}
                </div>
                {idx < PIPELINE.length - 1 && (
                  <div className="sr-only">{STATUS_CONFIG[step].label}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OffersPage() {
  const activeCount = activeOffers.length;
  const progressingCount = progressingOffers.length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Offer Tracking
        </h1>
        <p className="text-sm text-neutral-500">
          Monitor the progress of your submitted offers
        </p>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-50">
              <FileText className="size-4 stroke-[1.25] text-neutral-500" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total</p>
              <p className="text-xl font-bold text-neutral-900">
                {offers.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-success-light">
              <CheckCircle2 className="size-4 stroke-[1.25] text-success" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Active</p>
              <p className="text-xl font-bold text-neutral-900">{activeCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter">
              <TrendingUp className="size-4 stroke-[1.25] text-brand-primary" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">In Progression</p>
              <p className="text-xl font-bold text-neutral-900">
                {progressingCount}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-error-light">
              <XCircle className="size-4 stroke-[1.25] text-error" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Rejected</p>
              <p className="text-xl font-bold text-neutral-900">
                {offers.filter((o) => o.status === "rejected").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Active offers ───────────────────────────────────────────── */}
      {activeOffers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
            <span className="size-2 rounded-full bg-success" />
            Active Offers
          </h2>
          {activeOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </section>
      )}

      {/* ── Closed offers ───────────────────────────────────────────── */}
      {offers.some((o) => o.status === "rejected" || o.status === "withdrawn") && (
        <section className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
            <span className="size-2 rounded-full bg-neutral-300" />
            Closed Offers
          </h2>
          {offers
            .filter((o) => o.status === "rejected" || o.status === "withdrawn")
            .map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
        </section>
      )}

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {offers.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-50 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100">
            <Home className="size-7 stroke-[1.25] text-neutral-400" />
          </div>
          <div>
            <p className="font-medium text-neutral-900">No offers yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              When you submit an offer you can track its progress here
            </p>
          </div>
          <Link href="/search">
            <Button variant="outline" size="sm" className="mt-2">
              <Search className="mr-1.5 size-4 stroke-[1.25]" />
              Browse properties
            </Button>
          </Link>
        </div>
      )}

      {/* ── Guide link ──────────────────────────────────────────────── */}
      {offers.length > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-brand-primary-lighter px-4 py-3">
          <div className="flex items-center gap-3">
            <FileText className="size-4 stroke-[1.25] text-brand-primary" />
            <p className="text-sm font-medium text-brand-primary">
              New to the offer process?
            </p>
          </div>
          <Link href="/guides/offer-process">
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-primary hover:bg-brand-primary/10"
            >
              Read guide
              <ArrowRight className="ml-1.5 size-3.5 stroke-[1.25]" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
