import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildRentReferenceTable } from "@/lib/properties/rent-affordability-advanced";
import { formatGBP } from "@/lib/properties/rent-affordability-format";

export function RentReferenceTable() {
  const rows = buildRentReferenceTable();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Income needed by rent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Monthly rent</TableHead>
                <TableHead className="text-right">25% rule</TableHead>
                <TableHead className="text-right text-primary">30% rule</TableHead>
                <TableHead className="text-right">35% rule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.rent}>
                  <TableCell className="font-medium">{formatGBP(row.rent)}</TableCell>
                  <TableCell className="text-right">{formatGBP(row.at25)}</TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    {formatGBP(row.at30)}
                  </TableCell>
                  <TableCell className="text-right">{formatGBP(row.at35)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
