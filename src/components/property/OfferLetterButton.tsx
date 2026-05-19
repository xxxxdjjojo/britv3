/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function OfferLetterButton(
  props: Readonly<{ propertyAddress: string; propertyPrice: number }>,
) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [offerAmount, setOfferAmount] = useState(props.propertyPrice);
  const [mortgageInPrinciple, setMortgageInPrinciple] = useState(false);
  const [chainFree, setChainFree] = useState(false);
  const [completionDate, setCompletionDate] = useState("");
  const [conditions, setConditions] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!buyerName.trim() || !buyerAddress.trim()) return;

    setLoading(true);
    try {
      const [{ OfferLetterPdf }, { pdf }] = await Promise.all([
        import("./OfferLetterPdf"),
        import("@react-pdf/renderer"),
      ]);

      const conditionsList = conditions
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean);

      const blob = await pdf(
        <OfferLetterPdf
          data={{
            buyerName: buyerName.trim(),
            buyerAddress: buyerAddress.trim(),
            propertyAddress: props.propertyAddress,
            offerAmount,
            conditions: conditionsList,
            mortgageInPrinciple,
            chainFree,
            completionDate: completionDate || undefined,
            date: new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
          }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `offer-letter-${slugify(props.propertyAddress)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setOpen(false);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setLoading(false);
    }
  }, [
    buyerName,
    buyerAddress,
    offerAmount,
    mortgageInPrinciple,
    chainFree,
    completionDate,
    conditions,
    props.propertyAddress,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Generate Offer Letter
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Offer Letter</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="offer-buyer-name">Your Name *</Label>
            <Input
              id="offer-buyer-name"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-buyer-address">Your Address *</Label>
            <Textarea
              id="offer-buyer-address"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="123 Current Street, London, SW1A 1AA"
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-amount">Offer Amount</Label>
            <Input
              id="offer-amount"
              type="number"
              min={0}
              step={1000}
              value={offerAmount}
              onChange={(e) => setOfferAmount(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="offer-mortgage"
              checked={mortgageInPrinciple}
              onCheckedChange={(checked) =>
                setMortgageInPrinciple(checked === true)
              }
            />
            <Label htmlFor="offer-mortgage" className="font-normal">
              Mortgage in Principle obtained
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="offer-chain-free"
              checked={chainFree}
              onCheckedChange={(checked) => setChainFree(checked === true)}
            />
            <Label htmlFor="offer-chain-free" className="font-normal">
              Chain free
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-completion">
              Proposed Completion Date (optional)
            </Label>
            <Input
              id="offer-completion"
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="offer-conditions">
              Additional Conditions (one per line, optional)
            </Label>
            <Textarea
              id="offer-conditions"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Subject to satisfactory survey&#10;Subject to mortgage approval"
              rows={3}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !buyerName.trim() || !buyerAddress.trim()}
            className="w-full"
          >
            {loading ? "Generating PDF..." : "Generate PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
