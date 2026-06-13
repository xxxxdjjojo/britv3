
import {
  Clock,
  FileText,
  Home,
  PlusCircle,
  PoundSterling,
  TrendingUp,
} from "lucide-react";
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
import { InsightPanel } from "@/components/dashboard/InsightPanel";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
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

/**
 * Status pill tone for the Stitch "Active Proposals" table.
 * Maps each offer status onto the design-system semantic pill colours.
 */
function getStatusPillClass(status: OfferStatus): string {
  switch (status) {
    case "completion":
      return "bg-success/10 text-success";
    case "submitted":
    case "solicitors_instructed":
    case "searches":
    case "survey":
    case "mortgage_approved":
    case "exchange":
      return "bg-warning/10 text-warning";
    case "withdrawn":
    case "rejected":
      return "bg-destructive/10 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
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
const progressingOffers = offers.filter(
  (o) => PROGRESSION.indexOf(o.status) > 0,
);
const totalActivePence = activeOffers.reduce(
  (sum, o) => sum + o.amount_pence,
  0,
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OffersPage() {
  return (
    <div className="space-y-8">
      {/* Page heading + primary action */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-neutral-900">
            Offers &amp; Negotiations
          </h1>
          <p className="text-muted-foreground">
            Track the progress of your submitted offers
          </p>
        </div>
        <Button className="w-fit gap-2 bg-brand-gold text-brand-gold-foreground hover:bg-brand-gold/90">
          <PlusCircle className="size-4" />
          Submit New Offer
        </Button>
      </header>

      {/* Market Position banner + Investment Strategy insight */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-xl border border-border bg-surface p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Market Position
          </p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">
            Your current offers total £
            {penceToGBP(totalActivePence).toLocaleString("en-GB")}
          </p>
          <p className="text-muted-foreground">
            across {activeOffers.length} active proposals
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-5">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Total Offers
              </dt>
              <dd className="mt-1 text-3xl font-bold text-neutral-900">
                {offers.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Active
              </dt>
              <dd className="mt-1 text-3xl font-bold text-brand-primary">
                {activeOffers.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                In Progression
              </dt>
              <dd className="mt-1 text-3xl font-bold text-neutral-900">
                {progressingOffers.length}
              </dd>
            </div>
          </dl>
        </section>

        <InsightPanel
          eyebrow="Investment Strategy"
          title="Your AIP is valid for 42 days"
          icon={TrendingUp}
          action={{ label: "Update AIP", href: "#" }}
        >
          Keep your Agreement in Principle updated to strengthen every offer and
          move quickly when the right listing appears.
        </InsightPanel>
      </div>

      {/* Active Proposals + Submit Formal Offer */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <SectionHeader title="Active Proposals" />

          <div className="rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Offer Amount</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Step</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {offer.property_address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <PoundSterling className="size-3" />
                        {penceToGBP(offer.amount_pence).toLocaleString("en-GB")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="size-3" />
                        {offer.submitted_at}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border-transparent uppercase ${getStatusPillClass(
                          offer.status,
                        )}`}
                      >
                        {STATUS_LABELS[offer.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getNextStep(offer.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Negotiation Timeline + attached documents */}
            <div className="grid gap-6 border-t border-border p-6 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Negotiation Timeline
                </p>
                <ol className="mt-4 space-y-4">
                  <li className="flex gap-3">
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-primary" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        Offer received
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted to the vendor&rsquo;s agent
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-primary" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        Agent reviewing
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Verifying proof of funds and chain position
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-border" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        Vendor considering
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Awaiting a decision from the vendor
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Attached Documents
                </p>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="font-medium text-neutral-900">
                      Proof of Funds.pdf
                    </span>
                  </li>
                  <li className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="font-medium text-neutral-900">
                      Agreement in Principle.pdf
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Formal Offer form panel */}
        <aside className="h-fit rounded-xl border border-border bg-surface p-6">
          <h2 className="font-heading text-lg font-bold tracking-tight text-neutral-900">
            Submit Formal Offer
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All information is precise. This is a binding financial instrument.
          </p>

          <div className="mt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">
                Property
              </label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-neutral-900"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a property
                </option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.property_address}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">
                Offer Amount
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3">
                <PoundSterling className="size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="1,200,000"
                  className="w-full bg-transparent py-2 text-sm text-neutral-900 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">
                Conditions &amp; Clauses
              </label>
              <textarea
                rows={4}
                placeholder="Subject to survey, vacant possession, timeline preferences…"
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-neutral-900 outline-none"
              />
            </div>

            <Button className="w-full gap-2 bg-brand-primary text-white hover:bg-brand-primary-dark">
              Submit Offer Engagement
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
