
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Home, PoundSterling } from "lucide-react";
import { penceToGBP } from "@/lib/currency";

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
  /** Offer amount stored in pence. */
  amount_pence: number;
  status: OfferStatus;
  submitted_at: string;
}>;

// ---------------------------------------------------------------------------
// Status helpers
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

/**
 * Progress order for the offer state machine.
 * Higher index = further along.
 */
const PROGRESSION: OfferStatus[] = [
  "submitted",
  "solicitors_instructed",
  "searches",
  "survey",
  "mortgage_approved",
  "exchange",
  "completion",
];

function getNextStep(status: OfferStatus): string {
  const idx = PROGRESSION.indexOf(status);
  if (idx === -1) return "No further steps";
  if (idx === PROGRESSION.length - 1) return "Congratulations — sale complete!";
  const next = PROGRESSION[idx + 1];
  return `Next: ${STATUS_LABELS[next]}`;
}

function getBadgeVariant(
  status: OfferStatus,
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

// ---------------------------------------------------------------------------
// Placeholder data (replaced by real API data in Wave 1)
// ---------------------------------------------------------------------------

const offers: BuyerOffer[] = [
  {
    id: 1,
    property_address: "14 Maple Avenue, Bristol, BS1 4JQ",
    amount_pence: 32500000, // £325,000
    status: "searches",
    submitted_at: "2026-03-01",
  },
  {
    id: 2,
    property_address: "7 Oak Street, Bath, BA1 2AB",
    amount_pence: 45000000, // £450,000
    status: "submitted",
    submitted_at: "2026-03-10",
  },
  {
    id: 3,
    property_address: "22 Elm Road, Bristol, BS2 6GH",
    amount_pence: 28750000, // £287,500
    status: "rejected",
    submitted_at: "2026-02-20",
  },
];

// ---------------------------------------------------------------------------
// Derived summary stats
// ---------------------------------------------------------------------------

const activeOffers = offers.filter(
  (o) => o.status !== "withdrawn" && o.status !== "rejected",
);
const progressingOffers = offers.filter((o) => PROGRESSION.indexOf(o.status) > 0);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Offers</h1>
        <p className="text-muted-foreground">
          Track the progress of your submitted offers
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Offers</CardDescription>
            <CardTitle className="text-3xl">{offers.length}</CardTitle>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => (
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
                    <Badge variant={getBadgeVariant(offer.status)}>
                      {STATUS_LABELS[offer.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="size-3" />
                      {offer.submitted_at}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getNextStep(offer.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
