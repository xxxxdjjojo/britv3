"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SourcedFigure } from "@/components/trust/SourcedFigure";
import { PORTAL_COST_ASSUMPTIONS } from "@/config/portal-cost-assumptions";
import {
  buildPortalCostEstimate,
  UK_REGIONS,
  type PortalCostEstimate,
  type Region,
} from "@/lib/calculators/portal-cost";
import {
  trackToolCompleted,
  trackToolStarted,
} from "@/lib/analytics/influence-events";

const TOOL_KEY = "portal_cost_calculator";

const gbp = (value: number): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

const gbpExact = (value: number): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);

const pct = (value: number): string => `${value.toFixed(1)}%`;

function parsePositive(raw: string): number | null {
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Interactive Portal Cost Calculator. Every constant is shown with its source
 * (SourcedFigure) or explicitly labelled as an editable assumption. The output
 * is always labelled "Estimate"; CAT-claim copy uses "the claim alleges".
 */
export function PortalCostCalculator() {
  const [askingPrice, setAskingPrice] = useState("300000");
  const [region, setRegion] = useState<Region>("london");
  const [branches, setBranches] = useState("1");
  const [arpaMonthly, setArpaMonthly] = useState(
    String(PORTAL_COST_ASSUMPTIONS.arpaMonthly.value),
  );
  const [listingsPerBranch, setListingsPerBranch] = useState(
    String(PORTAL_COST_ASSUMPTIONS.listingsPerBranchMonthly.value),
  );
  const [ratePctLow, setRatePctLow] = useState(
    String(PORTAL_COST_ASSUMPTIONS.commissionRateLow.value * 100),
  );
  const [ratePctHigh, setRatePctHigh] = useState(
    String(PORTAL_COST_ASSUMPTIONS.commissionRateHigh.value * 100),
  );
  const [estimate, setEstimate] = useState<PortalCostEstimate | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const hasStarted = useRef(false);

  function markStarted() {
    if (hasStarted.current) return;
    hasStarted.current = true;
    trackToolStarted(TOOL_KEY);
  }

  function handleCalculate() {
    const price = parsePositive(askingPrice);
    const branchCount = parsePositive(branches);
    const arpa = parsePositive(arpaMonthly);
    const listings = parsePositive(listingsPerBranch);
    const rateLow = parsePositive(ratePctLow);
    const rateHigh = parsePositive(ratePctHigh);

    if (!price || !branchCount || !arpa || !listings || !rateLow || !rateHigh) {
      setInputError("Every field needs a number greater than zero.");
      setEstimate(null);
      return;
    }
    if (rateLow > rateHigh) {
      setInputError("The low commission rate can't exceed the high rate.");
      setEstimate(null);
      return;
    }

    setInputError(null);
    const result = buildPortalCostEstimate({
      askingPrice: price,
      region,
      agencySizeBranches: branchCount,
      overrides: {
        arpaMonthly: arpa,
        listingsPerBranchMonthly: listings,
        commissionRateLow: rateLow / 100,
        commissionRateHigh: rateHigh / 100,
      },
    });
    setEstimate(result);
    trackToolCompleted(TOOL_KEY, {
      asking_price: price,
      region,
      branches: branchCount,
    });
  }

  const arpaAssumption = PORTAL_COST_ASSUMPTIONS.arpaMonthly;
  const listingsAssumption = PORTAL_COST_ASSUMPTIONS.listingsPerBranchMonthly;
  const commissionAssumption = PORTAL_COST_ASSUMPTIONS.commissionRateLow;
  const catClaim = PORTAL_COST_ASSUMPTIONS.catClaimAllegedValue;

  return (
    <div className="space-y-8">
      {/* Your sale */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Your sale</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="asking-price">Asking price (£)</Label>
            <Input
              id="asking-price"
              type="number"
              inputMode="numeric"
              min={1}
              value={askingPrice}
              onChange={(e) => {
                markStarted();
                setAskingPrice(e.target.value);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region-select">Region</Label>
            <Select
              value={region}
              onValueChange={(value) => {
                markStarted();
                setRegion(value as Region);
              }}
            >
              <SelectTrigger id="region-select" className="w-full">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {UK_REGIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Region labels the illustration only — we have no sourced regional
              portal-fee data, so it never changes the maths.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branches">Agency size (branches, optional)</Label>
            <Input
              id="branches"
              type="number"
              inputMode="numeric"
              min={1}
              value={branches}
              onChange={(e) => {
                markStarted();
                setBranches(e.target.value);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assumptions panel */}
      <Card id="assumptions">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Our assumptions — edit them
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Every number below is either a published figure (with its source) or
            an explicitly labelled assumption. Change any of them and the
            estimate uses your figures instead.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="arpa">
                Portal cost per branch, per month (£)
              </Label>
              <Input
                id="arpa"
                type="number"
                inputMode="numeric"
                min={1}
                value={arpaMonthly}
                onChange={(e) => {
                  markStarted();
                  setArpaMonthly(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Default:{" "}
                <SourcedFigure
                  value={gbp(arpaAssumption.value)}
                  source={arpaAssumption.source}
                />{" "}
                — {arpaAssumption.label}.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="listings-per-branch">
                Listings per branch, per month{" "}
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  assumption
                </span>
              </Label>
              <Input
                id="listings-per-branch"
                type="number"
                inputMode="numeric"
                min={1}
                value={listingsPerBranch}
                onChange={(e) => {
                  markStarted();
                  setListingsPerBranch(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">{listingsAssumption.note}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-low">Commission rate — low (% inc VAT)</Label>
              <Input
                id="rate-low"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0.1}
                value={ratePctLow}
                onChange={(e) => {
                  markStarted();
                  setRatePctLow(e.target.value);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate-high">Commission rate — high (% inc VAT)</Label>
              <Input
                id="rate-high"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={0.1}
                value={ratePctHigh}
                onChange={(e) => {
                  markStarted();
                  setRatePctHigh(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Default range:{" "}
                <SourcedFigure
                  value="1.2%–1.8% inc VAT (typical sole-agency fee)"
                  source={commissionAssumption.source}
                />
                .
              </p>
            </div>
          </div>

          <Button type="button" onClick={handleCalculate} className="font-bold">
            Calculate estimate
          </Button>
          {inputError && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {inputError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Output */}
      {estimate && (
        <Card className="border-brand-primary/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-brand-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Estimate
              </span>
              <CardTitle className="font-heading text-xl">
                What the portal costs in your sale
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Estimated portal cost embedded in one listing
                </p>
                <p className="font-heading text-3xl font-extrabold text-brand-primary">
                  {gbpExact(estimate.portalCostPerListing)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {gbp(estimate.assumptions.arpaMonthly)} portal spend ÷{" "}
                  {estimate.assumptions.listingsPerBranchMonthly} listings per
                  branch per month
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Illustrative commission on {gbp(estimate.askingPrice)}
                </p>
                <p className="font-heading text-3xl font-extrabold">
                  {gbp(estimate.commissionLow)}–{gbp(estimate.commissionHigh)}
                </p>
                <p className="text-xs text-muted-foreground">
                  at {(estimate.assumptions.commissionRateLow * 100).toFixed(1)}%–
                  {(estimate.assumptions.commissionRateHigh * 100).toFixed(1)}% inc
                  VAT
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Portal cost as a share of that commission
                </p>
                <p className="font-heading text-3xl font-extrabold">
                  {pct(estimate.shareOfCommissionLowPct)}–
                  {pct(estimate.shareOfCommissionHighPct)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Estimated agency portal spend: {gbp(estimate.monthlyPortalSpend)}
                  /month across {estimate.agencySizeBranches}{" "}
                  {estimate.agencySizeBranches === 1 ? "branch" : "branches"}
                </p>
              </div>
            </div>

            <p className="rounded-lg bg-muted p-4 text-sm text-foreground">
              For context: a collective claim filed at the Competition Appeal
              Tribunal alleges that Rightmove overcharged estate agents and
              new-home developers — the claim alleges damages of up to{" "}
              <SourcedFigure value={gbp(catClaim.value)} source={catClaim.source} />
              . Rightmove denies the claim and nothing has been decided by the
              Tribunal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
