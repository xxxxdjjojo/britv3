"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnboardingStep } from "@/hooks/useOnboardingStep";
import { validateUTR, validateHmrcAmlReference } from "@/lib/validators/uk";
import { sanitize } from "@/lib/sanitize";

export function SoleTraderStep(
  props: Readonly<{
    stepNumber: number;
    onSubmit: () => void;
    onBack: () => void;
  }>,
) {
  const { saving, saveStep } = useOnboardingStep(props.stepNumber);
  const [utr, setUtr] = useState("");
  const [tradingName, setTradingName] = useState("");
  const [hmrcAml, setHmrcAml] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!validateUTR(utr)) errs.utr = "UTR must be exactly 10 digits";
    if (!tradingName.trim()) errs.tradingName = "Trading name is required";
    if (hmrcAml && !validateHmrcAmlReference(hmrcAml)) errs.hmrcAml = "Invalid HMRC AML reference";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const result = await saveStep(async () => {
      const res = await fetch("/api/verify/sole-trader", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utr_number: utr,
          trading_name: sanitize(tradingName),
          hmrc_aml_reference: hmrcAml || undefined,
          vat_number: vatNumber || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Verification failed");
      }
      return res.json();
    });

    if (result) props.onSubmit();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Sole Trader Verification
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Verify your self-employment details for UK compliance.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Unique Taxpayer Reference (UTR) <span className="text-red-500">*</span></Label>
          <Input
            placeholder="e.g. 1234567890"
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
            className="h-11 font-mono"
          />
          {errors.utr && <p className="text-xs text-red-600">{errors.utr}</p>}
          <p className="text-xs text-neutral-400">Your 10-digit UTR from HMRC. Found on your tax return.</p>
        </div>

        <div className="space-y-2">
          <Label>Trading Name <span className="text-red-500">*</span></Label>
          <Input
            placeholder="e.g. John Smith Properties"
            value={tradingName}
            onChange={(e) => setTradingName(e.target.value)}
            className="h-11"
          />
          {errors.tradingName && <p className="text-xs text-red-600">{errors.tradingName}</p>}
        </div>

        <div className="space-y-2">
          <Label>HMRC AML Reference <span className="text-xs text-neutral-400">(required for agents)</span></Label>
          <Input
            placeholder="e.g. XXML00000123456"
            value={hmrcAml}
            onChange={(e) => setHmrcAml(e.target.value.toUpperCase())}
            className="h-11 font-mono uppercase"
          />
          {errors.hmrcAml && <p className="text-xs text-red-600">{errors.hmrcAml}</p>}
          <p className="text-xs text-neutral-400">
            Estate and letting agents must be registered with HMRC under the Money Laundering Regulations 2017.
          </p>
        </div>

        <div className="space-y-2">
          <Label>VAT Number <span className="text-xs text-neutral-400">(optional)</span></Label>
          <Input
            placeholder="e.g. GB123456789"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value.toUpperCase())}
            className="h-11 font-mono uppercase"
          />
          <p className="text-xs text-neutral-400">Required if your annual turnover exceeds £90,000.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={props.onBack} className="flex-1">Back</Button>
        <Button onClick={handleSubmit} disabled={saving} className="flex-1">
          {saving ? "Saving..." : "Save and Continue"}
        </Button>
      </div>
    </div>
  );
}
