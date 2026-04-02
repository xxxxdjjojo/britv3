import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ServiceAreaMapEditorWrapper } from "@/components/dashboard/provider/ServiceAreaMapEditorWrapper";
import type { ProviderServiceArea } from "@/types/provider-dashboard";

export const metadata = {
  title: "Service Areas | Provider Dashboard",
};

export default async function ServiceAreasPage() {
  try {
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

  const providerId = providerProfile?.user_id ?? user.id;

  const { data: areas } = await supabase
    .from("provider_service_areas")
    .select("*")
    .eq("provider_id", providerId)
    .order("created_at", { ascending: true });

  const safeAreas: ProviderServiceArea[] = (areas ?? []) as ProviderServiceArea[];

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      {/* Page heading */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
          <MapPin className="size-5" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-neutral-900">Service Areas</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            Draw the geographic zones where you offer your services. Clients
            searching in these areas will see your profile.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">
          How to add a service area
        </h2>
        <ol className="list-decimal space-y-1 pl-4 text-sm text-neutral-600">
          <li>
            Click <strong>Draw Area</strong> to outline a custom polygon, or{" "}
            <strong>Draw Radius</strong> to draw a circular zone.
          </li>
          <li>Click on the map to place points. Double-click to finish.</li>
          <li>
            Click <strong>Save Zone</strong> to store the area.
          </li>
          <li>
            Use <strong>Select</strong> to move or delete an unsaved drawing.
          </li>
        </ol>
      </div>

      {/* Map editor — wrapped in client component so dynamic ssr:false is permitted */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <ServiceAreaMapEditorWrapper initialAreas={safeAreas} />
      </div>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="space-y-6 p-6 max-w-5xl">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">Service Areas</h1>
        <p className="text-sm text-neutral-500">Unable to load service areas. Please try refreshing the page.</p>
      </div>
    );
  }
}
