import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorPageHeader } from "@/components/calculators/CalculatorPageHeader";
import { PortalCostCalculator } from "@/components/tools/portal-cost/PortalCostCalculator";
import { MethodologyFooter } from "@/components/trust/MethodologyFooter";
import { ShareBar } from "@/components/trust/ShareBar";
import {
  PORTAL_COST_ASSUMPTIONS,
  PORTAL_COST_METHODOLOGY_VERSION,
  type PortalCostAssumption,
} from "@/config/portal-cost-assumptions";
import { getFeatureFlags } from "@/services/admin/feature-flag-service";

export const metadata: Metadata = {
  title: "Portal Cost Calculator | TrueDeed",
  description:
    "Estimate what your estate agent pays the property portals per listing, and what share of a typical commission that represents. Built from published figures — every assumption sourced and editable.",
};

const ALL_ASSUMPTIONS: ReadonlyArray<PortalCostAssumption> =
  Object.values(PORTAL_COST_ASSUMPTIONS);

const SOURCES = ALL_ASSUMPTIONS.flatMap((assumption) =>
  assumption.source ? [assumption.source] : [],
)
  .filter(
    (source, index, all) => all.findIndex((s) => s.url === source.url) === index,
  );

const CAVEATS = [
  "This is an estimate built from published averages, not your agent's actual invoice.",
  "Portal costs are business overheads; how they pass through to fees varies by agency.",
  "Figures referencing the Competition Appeal Tribunal claim against Rightmove are allegations from an unproven claim — Rightmove denies it and nothing has been decided.",
  `Methodology version ${PORTAL_COST_METHODOLOGY_VERSION}.`,
];

export default async function PortalCostCalculatorPage() {
  const flags = await getFeatureFlags();
  const isOn = flags.some(
    (flag) => flag.key === "portal_cost_calculator" && flag.enabled,
  );
  if (!isOn) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <CalculatorPageHeader
        title="Portal Cost Calculator"
        description="What does your agent pay the portals — and what does that mean for your sale?"
      />

      <div className="space-y-8">
        <PortalCostCalculator />

        <ShareBar title="Portal Cost Calculator" toolKey="portal_cost_calculator" />

        <MethodologyFooter sources={SOURCES} caveats={CAVEATS} />
      </div>
    </div>
  );
}
