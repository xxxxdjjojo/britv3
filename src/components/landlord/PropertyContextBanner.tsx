"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PropertyContextBanner(
  props: Readonly<{
    properties: ReadonlyArray<{ id: string; address: string }>;
  }>,
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const propertyId = searchParams.get("property");

  if (!propertyId) return null;

  const property = props.properties.find((p) => p.id === propertyId);
  if (!property) return null;

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("property");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-2.5 text-sm">
      <Building2 className="size-4 shrink-0 text-brand-primary" />
      <span className="font-medium text-neutral-700 dark:text-neutral-300">
        Viewing: {property.address}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClear}
        className="ml-auto h-6 px-2 text-neutral-500 hover:text-neutral-700"
      >
        <X className="size-3" />
        <span className="ml-1">Clear</span>
      </Button>
    </div>
  );
}
