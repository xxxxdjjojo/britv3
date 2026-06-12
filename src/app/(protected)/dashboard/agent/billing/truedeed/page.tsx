/**
 * Agent Truedeed billing page — mandate status card + invoices table.
 *
 * Server page (guard idiom from dashboard/agent/introductions/page.tsx).
 * Data is fetched with the service-role client, scoped to the signed-in
 * agent (invoices has no agent-facing RLS read path).
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGoCardlessConfigured } from "@/lib/truedeed/gocardless-client";
import { MandateSetupButton } from "@/components/dashboard/agent/billing/MandateSetupButton";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Truedeed Billing | Agent | Britestate",
};

type BillingProfile = {
  gocardless_mandate_id: string | null;
  mandate_status: string | null;
  billing_suspended_at: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  gross_pence: number;
  due_at: string;
  state: string;
  introductions: {
    listings: {
      properties: {
        address_line1: string | null;
        postcode: string | null;
      } | null;
    } | null;
  } | null;
};

const STATE_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  open: { label: "Open", className: "bg-slate-100 text-slate-700" },
  collecting: { label: "Collecting", className: "bg-blue-100 text-blue-700" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-700" },
  overdue: { label: "Overdue", className: "bg-amber-100 text-amber-800" },
  final_notice: { label: "Final notice", className: "bg-orange-100 text-orange-800" },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700" },
  disputed: { label: "Disputed", className: "bg-violet-100 text-violet-700" },
  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
  charged_back: { label: "Charged back", className: "bg-red-100 text-red-700" },
};

const MANDATE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted — activating (2–3 working days)",
  active: "Active",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
};

const EN_GB_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "Europe/London",
});

function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export default async function AgentTruedeedBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  let profile: BillingProfile | null = null;
  let invoices: InvoiceRow[] = [];

  try {
    const [{ data: profileData }, { data: invoiceData }] = await Promise.all([
      admin
        .from("agent_agency_profiles")
        .select("gocardless_mandate_id, mandate_status, billing_suspended_at")
        .eq("agent_id", user.id)
        .maybeSingle(),
      admin
        .from("invoices")
        .select(
          "id, invoice_number, gross_pence, due_at, state, introductions(listings(properties(address_line1, postcode)))",
        )
        .eq("org_agent_id", user.id)
        .order("due_at", { ascending: false }),
    ]);
    profile = profileData as unknown as BillingProfile | null;
    invoices = (invoiceData ?? []) as unknown as InvoiceRow[];
  } catch {
    // Query failed — render an empty billing view
  }

  const hasMandate = Boolean(profile?.gocardless_mandate_id);
  const mandateStatus = profile?.mandate_status ?? null;
  const gcConfigured = isGoCardlessConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Truedeed billing</h1>
        <p className="text-muted-foreground">
          Your Direct Debit mandate and success-fee invoices
        </p>
      </div>

      {profile?.billing_suspended_at && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">
              Your branch is suspended from the Truedeed network
            </CardTitle>
            <CardDescription className="text-red-700/80">
              Listings are hidden and no new introductions are made while an
              invoice remains unpaid. Reinstatement is automatic within 2
              working days of payment.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Direct Debit mandate</CardTitle>
          <CardDescription>
            Success fees are collected by Bacs Direct Debit on the invoice due
            date — 14 days after a confirmed completion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasMandate ? (
            <div className="flex items-center gap-3">
              <Badge
                className={
                  mandateStatus === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {MANDATE_STATUS_LABELS[mandateStatus ?? ""] ??
                  mandateStatus ??
                  "Unknown"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Mandate reference: {profile?.gocardless_mandate_id}
              </span>
            </div>
          ) : gcConfigured ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                No Direct Debit mandate is set up yet. Setting one up is a
                condition of network membership — it takes two minutes on the
                GoCardless secure page.
              </p>
              <MandateSetupButton />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Direct Debit billing is not yet enabled.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Success-fee invoices for completions introduced via Truedeed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const property = invoice.introductions?.listings?.properties;
                  const address =
                    [property?.address_line1, property?.postcode]
                      .filter(Boolean)
                      .join(", ") || "—";
                  const badge = STATE_BADGES[invoice.state] ?? {
                    label: invoice.state,
                    className: "bg-slate-100 text-slate-700",
                  };
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>{address}</TableCell>
                      <TableCell className="text-right">
                        {formatPounds(invoice.gross_pence)}
                      </TableCell>
                      <TableCell>
                        {EN_GB_DATE.format(new Date(invoice.due_at))}
                      </TableCell>
                      <TableCell>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
