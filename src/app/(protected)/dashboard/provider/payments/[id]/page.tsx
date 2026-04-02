import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getTransactionDetail } from "@/services/provider/provider-payment-service";
import { TransactionDetail } from "@/components/dashboard/provider/TransactionDetail";

export const metadata = { title: "Transaction Detail — Provider Dashboard" };

export default async function TransactionDetailPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
  try {
    const { id } = await props.params;

    const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile as { user_id: string } | null)?.user_id ?? user.id;

  let transaction;
  try {
    transaction = await getTransactionDetail(id, providerId, supabase);
  } catch (err) {
    // Authorization error — treat as not found for security
    if (err instanceof Error && err.message.includes("Authorization error")) {
      notFound();
    }
    throw err;
  }

  if (!transaction) {
    notFound();
  }

    return (
      <div className="max-w-2xl p-6">
        <TransactionDetail transaction={transaction} />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Transaction Detail</h1>
        <p className="mt-4 text-sm text-neutral-500">Unable to load transaction data. Please try refreshing the page.</p>
      </div>
    );
  }
}
