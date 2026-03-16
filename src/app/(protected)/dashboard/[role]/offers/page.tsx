"use client";

import { Fragment, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Home, Calendar } from "lucide-react";
import { useMyOffers, useSubmitOffer } from "@/hooks/useOffers";
import { formatPenceAsGBP } from "@/lib/currency";
import type { Offer, OfferStatus } from "@/services/offers/offers-service";

// ---------------------------------------------------------------------------
// Status machine steps (in order)
// ---------------------------------------------------------------------------
const STATUS_STEPS: OfferStatus[] = [
  "submitted",
  "solicitors_instructed",
  "searches",
  "survey",
  "mortgage_approved",
  "exchange",
  "completion",
];

const STATUS_LABELS: Record<OfferStatus, string> = {
  submitted: "Submitted",
  solicitors_instructed: "Solicitors Instructed",
  searches: "Searches",
  survey: "Survey",
  mortgage_approved: "Mortgage Approved",
  exchange: "Exchange",
  completion: "Completion",
  withdrawn: "Withdrawn",
};

// ---------------------------------------------------------------------------
// Badge colours
// ---------------------------------------------------------------------------
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function getStatusBadgeVariant(status: OfferStatus): BadgeVariant {
  switch (status) {
    case "submitted":
      return "secondary"; // amber-ish via secondary
    case "solicitors_instructed":
    case "searches":
    case "survey":
      return "outline"; // blue-ish
    case "mortgage_approved":
    case "exchange":
    case "completion":
      return "default"; // green-ish
    case "withdrawn":
      return "destructive";
  }
}

function StatusBadge({ status }: { status: OfferStatus }) {
  const className =
    status === "submitted"
      ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
      : status === "solicitors_instructed" ||
          status === "searches" ||
          status === "survey"
        ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
        : status === "mortgage_approved" ||
            status === "exchange" ||
            status === "completion"
          ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
          : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-300";

  return (
    <Badge variant={getStatusBadgeVariant(status)} className={className}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Status timeline strip
// ---------------------------------------------------------------------------
function StatusTimeline({ status }: { status: OfferStatus }) {
  if (status === "withdrawn") {
    return (
      <div className="flex items-center gap-1 px-2 pb-3 text-xs text-muted-foreground">
        Offer withdrawn
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0 px-2 pb-3 overflow-x-auto">
      {STATUS_STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isPending = idx > currentIndex;

        return (
          <div key={step} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                      ? "bg-blue-500 text-white ring-2 ring-blue-200"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span
                className={[
                  "mt-0.5 whitespace-nowrap text-[9px]",
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : isCurrent
                      ? "font-medium text-blue-600 dark:text-blue-400"
                      : "text-muted-foreground",
                  isPending ? "opacity-50" : "",
                ].join(" ")}
              >
                {STATUS_LABELS[step].split(" ")[0]}
              </span>
            </div>
            {/* Connector (not after last) */}
            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={[
                  "mx-1 h-px w-6 shrink-0",
                  idx < currentIndex ? "bg-green-400" : "bg-muted",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Offer Amount</TableHead>
              <TableHead>Asking Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-44" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Submit offer form inside a Sheet
// ---------------------------------------------------------------------------
function SubmitOfferSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const submitOffer = useSubmitOffer();
  const [listingId, setListingId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [conditions, setConditions] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    const amountGBP = parseFloat(amountStr);

    if (!listingId.trim()) {
      setValidationError("Listing ID is required.");
      return;
    }
    if (!agentId.trim()) {
      setValidationError("Agent ID is required.");
      return;
    }
    if (isNaN(amountGBP) || amountGBP <= 0) {
      setValidationError("Offer amount must be greater than £0.");
      return;
    }

    submitOffer.mutate(
      {
        listingId: listingId.trim(),
        agentId: agentId.trim(),
        amountGBP,
        conditions: conditions.trim() || undefined,
      },
      {
        onSuccess: () => {
          // Reset and close
          setListingId("");
          setAgentId("");
          setAmountStr("");
          setConditions("");
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Submit New Offer</SheetTitle>
          <SheetDescription>
            Enter the details of your offer. The agent will be notified.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="listing-id">Listing ID</Label>
            <Input
              id="listing-id"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-..."
              disabled={submitOffer.isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-id">Agent ID</Label>
            <Input
              id="agent-id"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="e.g. 550e8400-e29b-41d4-a716-..."
              disabled={submitOffer.isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Offer Amount (£)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                £
              </span>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                className="pl-7"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="250000"
                disabled={submitOffer.isPending}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="conditions">Conditions (optional)</Label>
            <Textarea
              id="conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="e.g. Subject to survey, vacant possession..."
              rows={4}
              disabled={submitOffer.isPending}
            />
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
        </form>

        <SheetFooter>
          <Button
            type="submit"
            disabled={submitOffer.isPending}
            onClick={handleSubmit}
            className="w-full"
          >
            {submitOffer.isPending ? "Submitting…" : "Submit Offer"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Stat cards
// ---------------------------------------------------------------------------
function StatCards({
  offers,
  isLoading,
}: {
  offers: Offer[];
  isLoading: boolean;
}) {
  const total = offers.length;
  const active = offers.filter(
    (o) => o.status !== "withdrawn" && o.status !== "completion",
  ).length;
  const accepted = offers.filter(
    (o) => o.status === "exchange" || o.status === "completion",
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Offers</CardDescription>
          <CardTitle className="text-3xl">
            {isLoading ? <Skeleton className="h-9 w-10" /> : total}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">All submitted offers</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Active Offers</CardDescription>
          <CardTitle className="text-3xl text-blue-600">
            {isLoading ? <Skeleton className="h-9 w-10" /> : active}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            In progress (not withdrawn or completed)
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Accepted Offers</CardDescription>
          <CardTitle className="text-3xl text-green-600">
            {isLoading ? <Skeleton className="h-9 w-10" /> : accepted}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">At exchange or completion</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function OffersPage() {
  const { data: offers, isLoading, isError, refetch } = useMyOffers();
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Offers</h1>
            <p className="text-muted-foreground">
              Track offers you have submitted on properties
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <p className="text-sm text-muted-foreground">
              Failed to load offers. Please try again.
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const offerList = offers ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Offers</h1>
          <p className="text-muted-foreground">
            Track offers you have submitted on properties
          </p>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="mr-2 size-4" />
          Submit New Offer
        </Button>
      </div>

      {/* Stat cards */}
      <StatCards offers={offerList} isLoading={isLoading} />

      {/* Offers table */}
      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : offerList.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-[160px] flex-col items-center justify-center gap-3 p-6 text-center">
            <Home className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No offers yet — find a property to make your first offer
            </p>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 size-4" />
              Submit New Offer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Offers</CardTitle>
            <CardDescription>Sorted by most recent submission</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Offer Amount</TableHead>
                  <TableHead>Asking Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offerList.map((offer) => (
                  <Fragment key={offer.id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="size-4 shrink-0 text-muted-foreground" />
                          <span className="font-medium">
                            {offer.listings?.address ?? offer.listing_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPenceAsGBP(offer.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {offer.listings?.price != null
                          ? formatPenceAsGBP(offer.listings.price)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={offer.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="size-3 shrink-0" />
                          {new Date(offer.created_at).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {/* Timeline strip row */}
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="py-0">
                        <StatusTimeline status={offer.status} />
                      </TableCell>
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Submit offer sheet */}
      <SubmitOfferSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
