import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { formatPounds } from "@/lib/market-map/format";
import type { MarketMapFeatureProperties } from "@/types/market-map";

type Props = Readonly<{
  /** Ranked cheapest → most expensive. */
  areas: MarketMapFeatureProperties[];
}>;

/** Ranked table of postcode districts (cheapest → most expensive). */
export function SubAreaTable({ areas }: Props) {
  const priced = areas.filter((a) => a.confidence !== "Insufficient");
  if (priced.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No areas with enough registered sales in this window.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">#</TableHead>
          <TableHead>District</TableHead>
          <TableHead className="text-right">Median sold price</TableHead>
          <TableHead className="hidden text-right sm:table-cell">
            Typical range
          </TableHead>
          <TableHead className="text-right">Sales</TableHead>
          <TableHead className="hidden text-right md:table-cell">Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {priced.map((area, i) => (
          <TableRow key={area.area_id}>
            <TableCell className="text-muted-foreground">{i + 1}</TableCell>
            <TableCell className="font-medium">{area.area_name}</TableCell>
            <TableCell className="text-right font-semibold">
              {formatPounds(area.median_price)}
            </TableCell>
            <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
              {formatPounds(area.p10_price)} – {formatPounds(area.p90_price)}
            </TableCell>
            <TableCell className="text-right">
              {area.transaction_count.toLocaleString("en-GB")}
            </TableCell>
            <TableCell className="hidden text-right md:table-cell">
              <ConfidenceBadge confidence={area.confidence} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
