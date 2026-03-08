"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import type { BuyerType } from "@/types/calculators";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

const BUYER_TYPE_OPTIONS: Array<{ value: BuyerType; label: string }> = [
  { value: "first_time", label: "First-time buyer" },
  { value: "standard", label: "Home mover" },
  { value: "additional", label: "Additional property" },
];

export function SdltCalculator() {
  const [buyerType, setBuyerType] = useState<BuyerType>("standard");
  const [propertyPrice, setPropertyPrice] = useState(300000);

  const result = useMemo(
    () => calculateSdlt(propertyPrice, buyerType),
    [propertyPrice, buyerType],
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label>Buyer Type</Label>
            <RadioGroup
              value={buyerType}
              onValueChange={(val) => setBuyerType(val as BuyerType)}
              className="space-y-2"
            >
              {BUYER_TYPE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sdlt-price">Property Price</Label>
            <Input
              id="sdlt-price"
              type="number"
              min={0}
              step={1000}
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stamp Duty Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <p className="text-muted-foreground text-sm">Total SDLT Payable</p>
            <p className="text-primary text-3xl font-bold">
              {formatCurrency(result.totalTax)}
            </p>
          </div>

          <div className="rounded-lg border p-3 text-center">
            <p className="text-muted-foreground text-xs">Effective Rate</p>
            <p className="text-lg font-semibold">
              {(result.effectiveRate * 100).toFixed(2)}%
            </p>
          </div>

          {result.bands.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.bands.map((band, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatCurrency(band.from)}</TableCell>
                    <TableCell>{formatCurrency(band.to)}</TableCell>
                    <TableCell className="text-right">
                      {(band.rate * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(band.tax)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <p className="text-muted-foreground text-xs">
            Rates effective from 1 April 2025. Scotland (LBTT) and Wales (LTT)
            have different rates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
