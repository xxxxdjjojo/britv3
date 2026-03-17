import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getTransactionDetail } from "@/services/provider/provider-payment-service";
import { TransactionDetail } from "@/components/dashboard/provider/TransactionDetail";

export const metadata = { title: "Transaction Detail — Provider Dashboard" };

export default async function TransactionDetailPage(
  props: Readonly<{ params: Promise<{ id: string }> }>,
) {
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
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile as { id: string } | null)?.id ?? user.id;

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
    <div className="p-6 max-w-2xl">
      <TransactionDetail transaction={transaction} />
    </div>
  );
}
