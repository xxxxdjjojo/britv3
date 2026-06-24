import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RoommatePerson } from "@/lib/properties/rent-affordability-advanced";
import { formatGBP } from "@/lib/properties/rent-affordability-format";

type Props = Readonly<{
  people: readonly RoommatePerson[];
  includeUtilities: boolean;
}>;

export function RoommateBreakdownTable({ people, includeUtilities }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Per-person breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead className="text-right">Rent share</TableHead>
                {includeUtilities && <TableHead className="text-right">Utilities</TableHead>}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow
                  key={person.label}
                  className={person.isYou ? "bg-primary/5 font-medium" : undefined}
                >
                  <TableCell>{person.label}</TableCell>
                  <TableCell className="text-right">{formatGBP(person.rentShare)}</TableCell>
                  {includeUtilities && (
                    <TableCell className="text-right">{formatGBP(person.utilities)}</TableCell>
                  )}
                  <TableCell className="text-right font-semibold">{formatGBP(person.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
