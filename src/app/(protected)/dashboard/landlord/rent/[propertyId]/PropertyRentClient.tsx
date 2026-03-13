"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RentPaymentRow } from "@/components/landlord/RentPaymentRow";
import type { RentCollectionEntry } from "@/types/landlord";

type PropertyRentClientProps = Readonly<{
  entries: RentCollectionEntry[];
}>;

async function markPaidApi(entryId: string): Promise<void> {
  const res = await fetch(`/api/landlord/rent/${entryId}/mark-paid`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to mark as paid");
}

/**
 * Client wrapper for the per-property rent history table.
 * Provides Mark Paid mutation via React Query.
 */
export function PropertyRentClient({ entries }: PropertyRentClientProps) {
  const queryClient = useQueryClient();

  const markPaidMutation = useMutation({
    mutationFn: markPaidApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rent-collection"] });
      toast.success("Payment marked as paid");
    },
    onError: () => {
      toast.error("Failed to mark payment as paid");
    },
  });

  if (entries.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No rent payments recorded for this property.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Tenant</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((item) => (
            <RentPaymentRow
              key={item.entry.id}
              entry={{
                ...item.entry,
                tenant_name: item.tenant_name,
                property_address: item.property_address,
              }}
              onMarkPaid={(id) => markPaidMutation.mutate(id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
