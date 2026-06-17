import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPounds } from "@/lib/market-map/format";
import type { RecentTransaction } from "@/types/market-map";

type Props = Readonly<{ transactions: RecentTransaction[] }>;

function formatAddress(t: RecentTransaction): string {
  return [t.paon, t.street].filter(Boolean).join(" ") || (t.postcode ?? "—");
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Recent registered sold-price transactions for the borough. */
export function RecentTransactionsTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No recent transactions in this window.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Address</TableHead>
          <TableHead className="hidden sm:table-cell">District</TableHead>
          <TableHead className="hidden sm:table-cell">Type</TableHead>
          <TableHead className="text-right">Price</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDate(t.date)}
            </TableCell>
            <TableCell className="font-medium">{formatAddress(t)}</TableCell>
            <TableCell className="hidden text-muted-foreground sm:table-cell">
              {t.outward_code ?? "—"}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{t.property_type}</TableCell>
            <TableCell className="text-right font-semibold">
              {formatPounds(t.price)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
