"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { calculateAffordability } from "@/lib/calculators/mortgage";
import { useMortgageParams } from "@/hooks/useMortgageParams";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export function PersonalizedEstimate(
  props: Readonly<{ propertyPrice: number }>,
) {
  const { params } = useMortgageParams();

  const result = useMemo(() => {
    if (!params) return null;
    return calculateAffordability(
      props.propertyPrice,
      params.deposit,
      params.interestRate,
      params.termYears,
    );
  }, [params, props.propertyPrice]);

  if (!params || !result) return null;

  const depositPercent =
    props.propertyPrice > 0
      ? Math.round((params.deposit / props.propertyPrice) * 100)
      : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Badge variant="secondary" className="text-xs font-normal" />}>
            Est. {formatCurrency(result.monthlyPayment)}/mo
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            Based on {depositPercent}% deposit, {params.interestRate}% rate,{" "}
            {params.termYears} years
          </p>
          <Link
            href="/tools/mortgage-calculator"
            className="text-primary text-xs underline"
          >
            Adjust
          </Link>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
