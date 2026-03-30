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
import { CheckCircle2 } from "lucide-react";

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
      <div className="flex h-40 flex-col items-center justify-center gap-2">
        <CheckCircle2 className="size-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No rent payments recorded for this property.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tenant</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
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
