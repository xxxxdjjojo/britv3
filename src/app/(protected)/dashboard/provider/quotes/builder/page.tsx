import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilderForm } from "@/components/dashboard/provider/QuoteBuilderForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Props = {
  searchParams: SearchParams;
};

export default async function QuoteBuilderPage({ searchParams }: Props) {
  const params = await searchParams;
  const requestId =
    typeof params["request_id"] === "string" ? params["request_id"] : undefined;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve provider id and display name
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;
  const providerName =
    (providerProfile?.business_name as string | null | undefined) ??
    user.email ??
    "Your Business";

  // If request_id is supplied, pre-fill from the service request
  let prefillClientName: string | undefined;
  let prefillJobTitle: string | undefined;
  let prefillCategory: string | undefined;

  if (requestId) {
    const { data: sr } = await supabase
      .from("service_requests")
      .select("title, category, client_name")
      .eq("id", requestId)
      .maybeSingle();

    if (sr) {
      prefillJobTitle = (sr.title as string | null | undefined) ?? undefined;
      prefillCategory = (sr.category as string | null | undefined) ?? undefined;
      prefillClientName = (sr.client_name as string | null | undefined) ?? undefined;
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            New Quote
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build and send a professional quote to your client.
          </p>
        </div>
      </div>

      <QuoteBuilderForm
        providerId={providerId}
        providerName={providerName}
        requestId={requestId}
        prefillClientName={prefillClientName}
        prefillJobTitle={prefillJobTitle}
        prefillCategory={prefillCategory}
      />
    </div>
  );
}
