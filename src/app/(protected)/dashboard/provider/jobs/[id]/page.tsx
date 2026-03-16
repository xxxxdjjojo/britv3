import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getJobDetail } from "@/services/provider/provider-job-service";
import { JobDetailView } from "@/components/dashboard/provider/JobDetailView";
import type { JobSidebarData } from "@/components/dashboard/provider/JobDetailView";

export const metadata = { title: "Job Detail — Provider Dashboard" };

type Params = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// Fetch sidebar supplemental data (quotes, invoice, review) directly
// ---------------------------------------------------------------------------

async function fetchSidebarData(
  jobId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<JobSidebarData> {
  // Quotes
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, total_amount, line_items")
    .eq("booking_id", jobId);

  const quoteRows = (quotes as Array<Record<string, unknown>> | null) ?? [];
  const firstQuote = quoteRows[0];
  const quoteLineCount = Array.isArray(firstQuote?.["line_items"])
    ? (firstQuote["line_items"] as unknown[]).length
    : quoteRows.length;

  // Invoice
  const { data: invoices } = await supabase
    .from("provider_invoices")
    .select("id, invoice_number, status")
    .eq("booking_id", jobId)
    .limit(1);

  const invoiceRows = (invoices as Array<Record<string, unknown>> | null) ?? [];
  const firstInvoice = invoiceRows[0];

  // Review
  const { data: reviews } = await supabase
    .from("reviews")
    .select("overall_rating, comment")
    .eq("booking_id", jobId)
    .limit(1);

  const reviewRows = (reviews as Array<Record<string, unknown>> | null) ?? [];
  const firstReview = reviewRows[0];

  return {
    quote: {
      exists: quoteRows.length > 0,
      totalPence:
        firstQuote?.["total_amount"] != null
          ? Math.round((firstQuote["total_amount"] as number) * 100)
          : null,
      lineCount: quoteLineCount,
    },
    invoice: {
      exists: invoiceRows.length > 0,
      number: (firstInvoice?.["invoice_number"] as string | null | undefined) ?? null,
      status: (firstInvoice?.["status"] as string | null | undefined) ?? null,
    },
    review: {
      exists: reviewRows.length > 0,
      rating: (firstReview?.["overall_rating"] as number | null | undefined) ?? null,
      comment: (firstReview?.["comment"] as string | null | undefined) ?? null,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function JobDetailPage({ params }: Params) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve provider id
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  // Fetch job detail
  let job;
  try {
    job = await getJobDetail(id, providerId, supabase);
  } catch {
    // Auth error — forbidden
    redirect("/dashboard/provider/jobs/active");
  }

  if (!job) {
    notFound();
  }

  // Fetch sidebar supplemental data
  const sidebar = await fetchSidebarData(id, supabase);

  return <JobDetailView job={job} sidebar={sidebar} />;
}
