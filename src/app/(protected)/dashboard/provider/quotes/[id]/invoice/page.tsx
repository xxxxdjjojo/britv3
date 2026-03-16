import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceGenerator } from "@/components/dashboard/provider/InvoiceGenerator";
import type { Quote } from "@/services/provider/provider-quote-service";
import type { InvoiceLineItem } from "@/types/provider-dashboard";

type Params = Promise<{ id: string }>;

type Props = {
  params: Params;
};

export default async function InvoicePage({ params }: Props) {
  const { id: quoteId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve provider details
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id, business_name, email")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile?.id as string | null | undefined) ?? user.id;
  const providerName =
    (providerProfile?.business_name as string | null | undefined) ??
    user.email ??
    "Your Business";
  const providerEmail =
    (providerProfile?.email as string | null | undefined) ??
    user.email ??
    undefined;

  // Fetch the quote to pre-fill line items
  const { data: quoteData, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .eq("provider_id", providerId)
    .maybeSingle();

  if (quoteError || !quoteData) {
    notFound();
  }

  const quote = quoteData as Quote;

  // Map quote line items → invoice line items (add vat_rate default 20%)
  const prefillLineItems: InvoiceLineItem[] = (quote.line_items ?? []).map((item) => ({
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unit_price_pence: item.unit_price_pence,
    total_pence: item.total_pence,
    vat_rate: 0.2, // default to 20% VAT
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Generate Invoice</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Based on quote{" "}
            <span className="font-medium text-foreground">{quote.quote_number}</span>
          </p>
        </div>
      </div>

      <InvoiceGenerator
        providerId={providerId}
        providerName={providerName}
        providerEmail={providerEmail}
        quoteId={quoteId}
        prefillLineItems={prefillLineItems}
        prefillNotes={quote.notes ?? undefined}
      />
    </div>
  );
}
