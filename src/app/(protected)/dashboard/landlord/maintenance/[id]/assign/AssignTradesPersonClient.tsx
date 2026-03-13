"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  TradesPersonAssignModal,
  type ProviderResult,
} from "@/components/landlord/TradesPersonAssignModal";

type Props = Readonly<{
  requestId: string;
  requestTitle: string;
  requestCategory: string;
  propertyPostcode: string;
  currentAssignedId?: string;
  providers: ProviderResult[];
}>;

/**
 * AssignTradesPersonClient
 * Handles the assignment API call and redirect after successful assignment.
 * Wraps TradesPersonAssignModal with the network logic.
 */
export function AssignTradesPersonClient({
  requestId,
  requestCategory,
  propertyPostcode,
  currentAssignedId,
  providers,
}: Props) {
  const router = useRouter();
  const [isAssigning, setIsAssigning] = useState(false);

  async function handleAssign(providerId: string) {
    setIsAssigning(true);
    try {
      const res = await fetch(
        `/api/landlord/maintenance/${requestId}/assign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider_id: providerId }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to assign tradesperson");
      }

      toast.success("Tradesperson assigned successfully");
      router.push(`/dashboard/landlord/maintenance/${requestId}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <TradesPersonAssignModal
      maintenanceCategory={requestCategory}
      propertyPostcode={propertyPostcode}
      currentAssignedId={currentAssignedId}
      providers={providers}
      onAssign={handleAssign}
      isAssigning={isAssigning}
    />
  );
}
