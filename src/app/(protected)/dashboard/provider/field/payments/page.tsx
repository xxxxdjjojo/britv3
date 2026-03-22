import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCashPosition } from "@/services/provider/provider-cash-position-service";
import { CashPositionWidget } from "@/components/dashboard/provider/CashPositionWidget";
import { fmtGbp } from "@/lib/format-money";

type SentInvoiceRow = {
  id: string;
  total_amount: number;
  client_id: string;
  invoice_number: string | null;
  profiles: { full_name: string | null } | null;
};

export default async function FieldPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile?.id as string | null) ?? user.id;

  const [cashPosition, invoicesResult] = await Promise.all([
    getCashPosition(providerId, supabase),
    supabase
      .from("provider_invoices")
      .select(
        `
        id,
        total_amount,
        client_id,
        invoice_number,
        profiles:client_id (
          full_name
        )
      `,
      )
      .eq("provider_id", providerId)
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const sentInvoices: SentInvoiceRow[] = (invoicesResult.data ?? []) as SentInvoiceRow[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-neutral-900">Payments</h1>
      </div>

      {/* Cash position widget */}
      <CashPositionWidget cashPosition={cashPosition} />

      {/* Collect payment section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Collect payment
          </h2>
          {sentInvoices.length > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {sentInvoices.length} awaiting
            </span>
          ) : null}
        </div>

        {sentInvoices.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-8 text-center shadow-sm">
            <p className="text-sm text-neutral-500">No invoices awaiting payment.</p>
            <Link
              href="/dashboard/provider/payments"
              className="mt-3 inline-block text-sm font-medium text-[#1B4D3E] hover:underline"
            >
              Create an invoice
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sentInvoices.map((invoice) => {
              const clientName =
                (invoice.profiles?.full_name) ?? "Client";
              const amountPence = Math.round((invoice.total_amount ?? 0) * 100);

              return (
                <div
                  key={invoice.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-neutral-900">
                        {fmtGbp(amountPence)}
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-600">{clientName}</p>
                      {invoice.invoice_number ? (
                        <p className="mt-0.5 text-xs text-neutral-400">
                          #{invoice.invoice_number}
                        </p>
                      ) : null}
                    </div>

                    <Link
                      href={`/dashboard/provider/payments/invoices/${invoice.id}`}
                      className="min-h-10 rounded-lg bg-[#1B4D3E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163d31]"
                    >
                      Collect
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Link to full payments view */}
      <Link
        href="/dashboard/provider/payments"
        className="block w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
      >
        View all payments
      </Link>
    </div>
  );
}
