"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SourcedFigure } from "@/components/trust/SourcedFigure";
import {
  trackToolCompleted,
  trackToolStarted,
} from "@/lib/analytics/influence-events";
import {
  buildMovingStack,
  buildTrueDeedComparison,
  type MovingStackLineItem,
  type MovingStackLocation,
  type SellerPlanSummary,
} from "@/lib/calculators/moving-stack";
import type { BuyerType } from "@/types/calculators";

const TOOL_KEY = "moving_cost_stack";

const DEFAULT_PRICE = 300000;
const OVERRIDE_MIN_PCT = 1.0;
const OVERRIDE_MAX_PCT = 2.5;
const OVERRIDE_STEP_PCT = 0.05;
const DEFAULT_OVERRIDE_PCT = 1.4;

const LOCATIONS: ReadonlyArray<{ value: MovingStackLocation; label: string }> = [
  { value: "england", label: "England" },
  { value: "wales", label: "Wales" },
  { value: "scotland", label: "Scotland" },
  { value: "ni", label: "Northern Ireland" },
];

const BUYER_TYPES: ReadonlyArray<{ value: BuyerType; label: string }> = [
  { value: "standard", label: "Home mover (standard)" },
  { value: "first_time", label: "First-time buyer" },
  { value: "additional", label: "Additional property" },
];

const gbp = (value: number): string =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);

function formatRange(item: MovingStackLineItem): string {
  return item.low === item.high
    ? gbp(item.low)
    : `${gbp(item.low)} – ${gbp(item.high)}`;
}

function KindBadge({ kind }: Readonly<{ kind: MovingStackLineItem["kind"] }>) {
  const copy: Record<MovingStackLineItem["kind"], string> = {
    tax: "Exact tax",
    fee: "Your rate",
    range: "Typical range",
    estimate: "Estimate",
  };
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
      {copy[kind]}
    </span>
  );
}

/**
 * Total Cost of Moving Stack. Every line item shows its figure with a source
 * citation (SourcedFigure) or an explicit assumption/estimate label. Taxes
 * come from the same pure calculators as the stamp-duty page — never
 * re-implemented. When selling, TrueDeed's real seller tiers (mapped from
 * server-only billing-config by the page and passed as `sellerPlans`) are
 * shown against the traditional commission.
 */
export function MovingStackCalculator({
  sellerPlans,
}: Readonly<{ sellerPlans: ReadonlyArray<SellerPlanSummary> }>) {
  const [propertyPrice, setPropertyPrice] = useState(DEFAULT_PRICE);
  const [location, setLocation] = useState<MovingStackLocation>("england");
  const [buyerType, setBuyerType] = useState<BuyerType>("standard");
  const [selling, setSelling] = useState(false);
  const [useOwnRate, setUseOwnRate] = useState(false);
  const [ownRatePct, setOwnRatePct] = useState(DEFAULT_OVERRIDE_PCT);
  const hasStarted = useRef(false);
  const hasCompleted = useRef(false);

  function markStarted() {
    if (hasStarted.current) return;
    hasStarted.current = true;
    trackToolStarted(TOOL_KEY);
  }

  const agentCommissionRate =
    selling && useOwnRate ? ownRatePct / 100 : undefined;

  const stack = buildMovingStack({
    propertyPrice: propertyPrice > 0 ? propertyPrice : DEFAULT_PRICE,
    location,
    buyerType,
    selling,
    agentCommissionRate,
  });
  const comparison = selling
    ? buildTrueDeedComparison(
        propertyPrice > 0 ? propertyPrice : DEFAULT_PRICE,
        sellerPlans,
      )
    : null;

  // Fire tool_completed once, on the first calculation render after the user
  // has actually interacted (the stack recomputes live on every input change).
  useEffect(() => {
    if (!hasStarted.current || hasCompleted.current) return;
    hasCompleted.current = true;
    trackToolCompleted(TOOL_KEY, {
      property_price: propertyPrice,
      location,
      buyer_type: buyerType,
      selling,
    });
  }, [propertyPrice, location, buyerType, selling]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    markStarted();
    const parsed = parseFloat(e.target.value);
    setPropertyPrice(!Number.isNaN(parsed) && parsed >= 0 ? parsed : 0);
  };

  return (
    <div className="space-y-8">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your move</CardTitle>
          <CardDescription>
            Enter your purchase details — add your sale to see the full stack.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="property-price">Property price (£)</Label>
              <Input
                id="property-price"
                type="number"
                inputMode="numeric"
                min={0}
                step={5000}
                value={propertyPrice}
                onChange={handlePriceChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select
                value={location}
                onValueChange={(value) => {
                  markStarted();
                  if (value) setLocation(value as MovingStackLocation);
                }}
              >
                <SelectTrigger id="location" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyer-type">Buyer type</Label>
              <Select
                value={buyerType}
                onValueChange={(value) => {
                  markStarted();
                  if (value) setBuyerType(value as BuyerType);
                }}
              >
                <SelectTrigger id="buyer-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUYER_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="selling-toggle"
              aria-label="I'm also selling a property"
              checked={selling}
              onCheckedChange={(checked) => {
                markStarted();
                setSelling(checked);
              }}
            />
            <Label htmlFor="selling-toggle" className="cursor-pointer">
              I&apos;m also selling a property
            </Label>
          </div>

          {selling && (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Switch
                  id="own-rate-toggle"
                  aria-label="I know my agent's commission rate"
                  checked={useOwnRate}
                  onCheckedChange={(checked) => {
                    markStarted();
                    setUseOwnRate(checked);
                  }}
                />
                <Label htmlFor="own-rate-toggle" className="cursor-pointer">
                  I know my agent&apos;s commission rate
                </Label>
              </div>
              {useOwnRate && (
                <div className="space-y-2">
                  <Label htmlFor="own-rate-slider">
                    Agent commission: {ownRatePct.toFixed(2)}% inc VAT
                  </Label>
                  <Slider
                    id="own-rate-slider"
                    aria-label="Agent commission rate (% inc VAT)"
                    min={OVERRIDE_MIN_PCT}
                    max={OVERRIDE_MAX_PCT}
                    step={OVERRIDE_STEP_PCT}
                    value={ownRatePct}
                    onValueChange={(value) => {
                      const next = Array.isArray(value) ? value[0] : value;
                      if (typeof next === "number") setOwnRatePct(next);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {OVERRIDE_MIN_PCT.toFixed(1)}%–{OVERRIDE_MAX_PCT.toFixed(1)}%
                    — replaces the typical published range with your figure.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* The brutal stack */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            The full moving-cost stack for a {gbp(propertyPrice)} property
          </CardTitle>
          <CardDescription>
            Every figure is a sourced published range, an exact tax from HMRC /
            devolved rates, or an explicitly labelled estimate — never a quote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {stack.items.map((item) => (
              <li key={item.key} className="space-y-1 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {item.label}
                    <KindBadge kind={item.kind} />
                  </span>
                  {item.source ? (
                    <SourcedFigure
                      value={formatRange(item)}
                      source={item.source}
                      className="text-sm font-semibold tabular-nums text-foreground"
                    />
                  ) : (
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatRange(item)}{" "}
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                        assumption
                      </span>
                    </span>
                  )}
                </div>
                {item.note && (
                  <p className="text-xs text-muted-foreground">{item.note}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border border-brand-primary/30 bg-muted p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Estimated total cost of moving
            </p>
            <p
              className="font-heading text-3xl font-extrabold tabular-nums text-brand-primary"
              data-testid="stack-total"
            >
              {gbp(stack.totalLow)} – {gbp(stack.totalHigh)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Typical published ranges plus exact tax — actual quotes will vary.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* TrueDeed comparison */}
      {comparison && (
        <Card className="border-brand-primary/30">
          <CardHeader>
            <CardTitle className="text-base">
              The brutal stack vs TrueDeed&apos;s real tiers
            </CardTitle>
            <CardDescription>
              What selling the same {gbp(propertyPrice)} property costs on each
              TrueDeed seller plan — upfront fee plus commission on completion.
              These are our published prices, not marketing shorthand.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {comparison.tiers.map((tier) => {
                const isCheapest = tier.id === comparison.cheapestId;
                return (
                  <div
                    key={tier.id}
                    className={`rounded-xl border p-4 ${
                      isCheapest
                        ? "border-brand-primary bg-brand-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-foreground">{tier.name}</p>
                      {isCheapest && (
                        <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          Cheapest at this price
                        </span>
                      )}
                    </div>
                    <p className="mt-2 font-heading text-2xl font-extrabold tabular-nums text-brand-primary">
                      {gbp(tier.total)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {gbp(tier.fixedFee)} upfront + {tier.commissionLabel} (
                      {gbp(tier.commissionAtPrice)} at this price)
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Which tier is cheapest depends on your sale price — higher prices
              favour the lower-commission tiers.{" "}
              <Link
                href="/fee-transparency"
                className="font-medium text-brand-primary underline underline-offset-2 hover:text-brand-primary-dark"
              >
                See full fee transparency
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
