"use client";

import dynamic from "next/dynamic";
import type { ProviderServiceArea } from "@/types/provider-dashboard";

// MapLibre + terra-draw require a browser environment — ssr: false must be in a Client Component
const ServiceAreaMapEditor = dynamic(
  () =>
    import(
      "@/components/dashboard/provider/ServiceAreaMapEditor"
    ).then((m) => m.ServiceAreaMapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
        <p className="text-sm text-neutral-500">Loading map…</p>
      </div>
    ),
  },
);

type ServiceAreaMapEditorWrapperProps = Readonly<{
  initialAreas: ProviderServiceArea[];
}>;

export function ServiceAreaMapEditorWrapper({
  initialAreas,
}: ServiceAreaMapEditorWrapperProps) {
  return <ServiceAreaMapEditor initialAreas={initialAreas} />;
}
