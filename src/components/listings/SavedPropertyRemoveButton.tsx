"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnsaveProperty } from "@/hooks/useSavedProperties";

export function SavedPropertyRemoveButton(
  props: Readonly<{ listingId: string }>,
) {
  const unsave = useUnsaveProperty();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="absolute right-2 top-2 size-8 rounded-full bg-white/80 p-0 shadow-sm hover:bg-white"
      onClick={() => unsave.mutate({ listingId: props.listingId })}
      disabled={unsave.isPending}
      aria-label="Remove from saved"
    >
      <X className="size-4 text-neutral-600" />
    </Button>
  );
}
