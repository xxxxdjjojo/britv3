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
      .select("title, service_category")
      .eq("id", requestId)
      .maybeSingle();

    if (sr) {
      prefillJobTitle = (sr.title as string | null | undefined) ?? undefined;
      prefillCategory =
        (sr.service_category as string | null | undefined) ?? undefined;
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Quote Builder
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
          New Quote
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build a professional quote to send directly to your client.
        </p>
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
