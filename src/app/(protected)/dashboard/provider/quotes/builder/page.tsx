import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteBuilderForm } from "@/components/dashboard/provider/QuoteBuilderForm";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Props = {
  searchParams: SearchParams;
};

export default async function QuoteBuilderPage({ searchParams }: Props) {
  try {
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
    .select("user_id, business_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;
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
    <div className="min-h-screen bg-[#faf9f8]">
      {/* Page header */}
      <div className="pt-8 px-10 pb-6 max-w-7xl mx-auto">
        <div className="space-y-1 mb-8">
          <span className="text-[11px] font-bold tracking-widest text-[#003629] uppercase">
            Draft Status: Active
          </span>
          <h1 className="text-3xl font-bold font-heading text-[#003629] tracking-tight">
            Create Professional Bid
          </h1>
          <p className="text-stone-500 max-w-lg text-sm">
            Outline the scope of work and financials for your next premium
            project. The preview updates in real-time.
          </p>
        </div>
      </div>

      {/* Form + Preview canvas */}
      <div className="px-10 pb-16 max-w-7xl mx-auto">
        <QuoteBuilderForm
          providerId={providerId}
          providerName={providerName}
          requestId={requestId}
          prefillClientName={prefillClientName}
          prefillJobTitle={prefillJobTitle}
          prefillCategory={prefillCategory}
        />
      </div>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="min-h-screen bg-[#faf9f8] pt-8 px-10">
        <h1 className="text-3xl font-bold font-heading text-[#003629]">Create Professional Bid</h1>
        <p className="mt-4 text-sm text-stone-500">Unable to load quote builder. Please try refreshing the page.</p>
      </div>
    );
  }
}
