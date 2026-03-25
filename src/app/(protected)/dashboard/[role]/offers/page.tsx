"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, Home, Plus, PoundSterling } from "lucide-react";
import { penceToGBP } from "@/lib/currency";
import { useOffers, useWithdrawOffer } from "@/hooks/useOffers";
import { SubmitOfferDialog } from "@/components/offers/SubmitOfferDialog";
import type { BuyerOffer, OfferStatus } from "@/services/offers/offers-service";

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type DisplayStatus = OfferStatus | "rejected";

const STATUS_LABELS: Record<DisplayStatus, string> = {
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

/**
 * Progress order for the offer state machine.
 * Higher index = further along.
 */
const PROGRESSION: DisplayStatus[] = [
  "submitted",
  "solicitors_instructed",
  "searches",
  "survey",
  "mortgage_approved",
  "exchange",
  "completion",
];

function getNextStep(status: DisplayStatus): string {
  const idx = PROGRESSION.indexOf(status);
  if (idx === -1) return "No further steps";
  if (idx === PROGRESSION.length - 1) return "Congratulations -- sale complete!";
  const next = PROGRESSION[idx + 1];
  return `Next: ${STATUS_LABELS[next]}`;
}

function getBadgeVariant(
  status: DisplayStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completion":
      return "default";
    case "submitted":
    case "solicitors_instructed":
    case "searches":
    case "survey":
    case "mortgage_approved":
    case "exchange":
      return "secondary";
    case "withdrawn":
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

/** Statuses that cannot be withdrawn. */
const NON_WITHDRAWABLE: Set<string> = new Set(["withdrawn", "rejected", "completion"]);

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function OffersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-1 h-9 w-12" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OffersPage() {
  const { data: offersData = [], isLoading, error, refetch } = useOffers();
  const withdrawMutation = useWithdrawOffer();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Derived summary stats
  const { activeOffers, progressingOffers } = useMemo(() => {
    const active = offersData.filter(
      (o: BuyerOffer) => o.status !== "withdrawn" && (o.status as string) !== "rejected",
    );
    const progressing = offersData.filter(
      (o: BuyerOffer) => PROGRESSION.indexOf(o.status as DisplayStatus) > 0,
    );
    return { activeOffers: active, progressingOffers: progressing };
  }, [offersData]);

  // Loading state
  if (isLoading) {
    return <OffersLoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Offers</h1>
          <p className="text-muted-foreground">
            Track the progress of your submitted offers
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Failed to load offers</AlertTitle>
          <AlertDescription className="flex items-center gap-4">
            <span>{error.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (offersData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Offers</h1>
            <p className="text-muted-foreground">
              Track the progress of your submitted offers
            </p>
          </div>
          <SubmitOfferDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 size-4" />
              New Offer
            </Button>
          </SubmitOfferDialog>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Home className="mb-4 size-12 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No offers yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When you submit an offer on a property, it will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Offers</h1>
          <p className="text-muted-foreground">
            Track the progress of your submitted offers
          </p>
        </div>
        <SubmitOfferDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 size-4" />
            New Offer
          </Button>
        </SubmitOfferDialog>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Offers</CardDescription>
            <CardTitle className="text-3xl">{offersData.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {activeOffers.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progression</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {progressingOffers.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Offers table */}
      <Card>
        <CardHeader>
          <CardTitle>All Offers</CardTitle>
          <CardDescription>Sorted by most recent</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Offer Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Submitted</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offersData.map((offer: BuyerOffer) => {
                const displayStatus = offer.status as DisplayStatus;
                const canWithdraw = !NON_WITHDRAWABLE.has(offer.status);

                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="size-4 text-muted-foreground" />
                        <span className="font-medium">{offer.property_address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <PoundSterling className="size-3" />
                        {penceToGBP(offer.amount_pence).toLocaleString("en-GB")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(displayStatus)}>
                        {STATUS_LABELS[displayStatus] ?? displayStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="size-3" />
                        {formatDate(offer.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getNextStep(displayStatus)}
                    </TableCell>
                    <TableCell>
                      {canWithdraw && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={withdrawMutation.isPending}
                          onClick={() => withdrawMutation.mutate({ offerId: offer.id })}
                        >
                          Withdraw
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
