/**
 * Agent Truedeed billing page — mandate status card + invoices table.
 *
 * Server page (guard idiom from dashboard/agent/introductions/page.tsx).
 * Data is fetched with the service-role client, scoped to the signed-in
 * agent (invoices has no agent-facing RLS read path). Phase 5 adds the
 * dispute affordance: each invoice carries its clause-9.5 window end and
 * whether a dispute already exists, and the rendered table is the client
 * component AgentInvoicesTable that owns the DisputeInvoiceModal state and
 * POSTs to /api/truedeed/disputes.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isGoCardlessConfigured } from "@/lib/truedeed/gocardless-client";
import {
  addBusinessDays,
  getEnglandWalesBankHolidays,
} from "@/lib/business-days";
import { MandateSetupButton } from "@/components/dashboard/agent/billing/MandateSetupButton";
import {
  AgentInvoicesTable,
  type AgentInvoiceRow,
} from "@/components/dashboard/agent/billing/AgentInvoicesTable";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Truedeed Billing | Agent | TrueDeed",
};

const CLAUSE_9_5_WINDOW_BUSINESS_DAYS = 10;

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
  issued_at: string;
  state: string;
  introductions: {
    listings: {
      properties: {
        address_line1: string | null;
        postcode: string | null;
      } | null;
    } | null;
  } | null;
  invoice_disputes: { id: string }[] | null;
};

const MANDATE_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted — activating (2–3 working days)",
  active: "Active",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
};

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
          "id, invoice_number, gross_pence, due_at, issued_at, state, " +
            "introductions(listings(properties(address_line1, postcode))), " +
            "invoice_disputes(id)",
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

  // Clause-9.5 window: server-side so the table is deterministic across
  // client clock skew.
  const holidays = await getEnglandWalesBankHolidays();
  // eslint-disable-next-line react-hooks/purity -- server component; deterministic window calc
  const now = Date.now();
  const tableInvoices: AgentInvoiceRow[] = invoices.map((row) => {
    const issuedAt = row.issued_at;
    const windowEnd = addBusinessDays(
      new Date(issuedAt),
      CLAUSE_9_5_WINDOW_BUSINESS_DAYS,
      holidays,
    );
    const property = row.introductions?.listings?.properties;
    const address =
      [property?.address_line1, property?.postcode].filter(Boolean).join(", ") ||
      "—";
    const hasDispute = Array.isArray(row.invoice_disputes)
      ? row.invoice_disputes.length > 0
      : false;
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      grossPence: row.gross_pence,
      dueAt: row.due_at,
      issuedAt,
      state: row.state,
      propertyAddress: address,
      hasDispute,
      windowOpen: now <= windowEnd.getTime(),
      windowEnd: windowEnd.toISOString(),
    };
  });

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
            Success-fee invoices for completions introduced via Truedeed. You
            have 10 business days from the invoice date to dispute under
            clause 9.5.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentInvoicesTable invoices={tableInvoices} />
        </CardContent>
      </Card>
    </div>
  );
}
