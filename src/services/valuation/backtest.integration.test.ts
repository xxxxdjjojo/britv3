import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { calculateValuation } from "./valuation-service";
import { fetchBacktestTargets } from "./comparables-repo";
import type { ValuationSubject, PpdPropertyType } from "@/types/valuation";
import { MODEL_VERSION } from "@/lib/valuation/constants";

/**
 * Out-of-time historical backtest. Each target sale is valued AS OF its own sale
 * date, using only earlier sales and never itself, then compared to the price
 * that actually transacted. Gated behind RUN_VALUATION_DB=1 + SUPABASE_DB_URL.
 *
 *   SUPABASE_DB_URL=... RUN_VALUATION_DB=1 npx vitest run \
 *     src/services/valuation/backtest.integration.test.ts --testTimeout=600000
 */
const ENABLED = process.env.RUN_VALUATION_DB === "1" && Boolean(process.env.SUPABASE_DB_URL);

const OUTWARDS = ["SW18", "SW17", "M4", "LS6", "B1", "CF10"]; // London, Manchester, Leeds, Birmingham, Cardiff
const PER_OUTWARD = 25;
const FROM = "2025-06-01";
const TO = "2026-02-01";

type Eval = {
  actual: number;
  estimate: number | null;
  ape: number | null;
  withinRange: boolean;
  rangeWidthPct: number | null;
  type: PpdPropertyType;
  evidence: string;
  fallback: string;
  hasPriorSale: boolean;
  priceBand: string;
  outward: string;
};

function priceBand(p: number): string {
  if (p < 250_000) return "<£250k";
  if (p < 500_000) return "£250k–£500k";
  if (p < 1_000_000) return "£500k–£1m";
  return "≥£1m";
}

function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (n: number, d: number) => (d ? (100 * n) / d : NaN);

function summarise(rows: Eval[]) {
  const estimated = rows.filter((r) => r.estimate !== null);
  const apes = estimated.map((r) => r.ape!).filter((x) => Number.isFinite(x));
  const absErrs = estimated.map((r) => Math.abs(r.estimate! - r.actual));
  const logSqErr = estimated.map((r) => (Math.log(r.estimate!) - Math.log(r.actual)) ** 2);
  return {
    n: rows.length,
    nEstimated: estimated.length,
    noEstimateRatePct: pct(rows.length - estimated.length, rows.length),
    medianAPEPct: median(apes) * 100,
    meanAPEPct: mean(apes) * 100,
    maePounds: Math.round(mean(absErrs)),
    logRMSE: Math.sqrt(mean(logSqErr)),
    within5Pct: pct(apes.filter((a) => a <= 0.05).length, apes.length),
    within10Pct: pct(apes.filter((a) => a <= 0.1).length, apes.length),
    within20Pct: pct(apes.filter((a) => a <= 0.2).length, apes.length),
    rangeCoveragePct: pct(estimated.filter((r) => r.withinRange).length, estimated.length),
    medianRangeWidthPct:
      median(estimated.map((r) => r.rangeWidthPct!).filter((x) => Number.isFinite(x))) * 100,
  };
}

function groupTable(rows: Eval[], key: (r: Eval) => string): string {
  const groups = new Map<string, Eval[]>();
  for (const r of rows) {
    const k = key(r);
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const lines = ["| Segment | n | est. | median APE | within 10% | within 20% | range cover |", "|---|---|---|---|---|---|---|"];
  for (const [k, rs] of [...groups.entries()].sort()) {
    const s = summarise(rs);
    lines.push(
      `| ${k} | ${s.n} | ${s.nEstimated} | ${s.medianAPEPct.toFixed(1)}% | ${s.within10Pct.toFixed(0)}% | ${s.within20Pct.toFixed(0)}% | ${s.rangeCoveragePct.toFixed(0)}% |`,
    );
  }
  return lines.join("\n");
}

describe.runIf(ENABLED)("valuation backtest (real Land Registry, out-of-time)", () => {
  it("evaluates targets and writes a reproducible measured validation report", async () => {
    const targets = await fetchBacktestTargets({
      outwardCodes: OUTWARDS,
      fromDate: FROM,
      toDate: TO,
      perOutward: PER_OUTWARD,
    });
    expect(targets.length).toBeGreaterThan(20);

    const rows: Eval[] = [];
    for (const t of targets) {
      const subject: ValuationSubject = {
        postcode: t.postcode,
        outwardCode: t.outwardCode,
        propertyType: t.propertyType,
        tenure: t.tenure,
        newBuild: t.newBuild,
        bedrooms: null,
        bathrooms: null,
        floorAreaSqm: null,
        condition: null,
        paon: t.paon,
        saon: t.saon,
        street: t.street,
      };
      const r = await calculateValuation({
        subject,
        valuationDate: t.saleDate,
        asOfDate: t.saleDate,
        excludeTransactionId: t.transactionId,
        dataCutoffDate: t.saleDate,
      });
      const estimate = r.estimatedValue;
      rows.push({
        actual: t.price,
        estimate,
        ape: estimate !== null ? Math.abs(estimate - t.price) / t.price : null,
        withinRange:
          estimate !== null && r.estimatedLow !== null && r.estimatedHigh !== null
            ? t.price >= r.estimatedLow && t.price <= r.estimatedHigh
            : false,
        rangeWidthPct:
          estimate !== null && r.estimatedLow !== null && r.estimatedHigh !== null && estimate > 0
            ? (r.estimatedHigh - r.estimatedLow) / estimate
            : null,
        type: t.propertyType,
        evidence: r.evidenceQuality,
        fallback: r.fallbackLevel,
        hasPriorSale: r.lastRegisteredSale !== null,
        priceBand: priceBand(t.price),
        outward: t.outwardCode,
      });
    }

    const overall = summarise(rows);
    expect(Number.isFinite(overall.medianAPEPct)).toBe(true);

    const typeName: Record<string, string> = { D: "Detached", S: "Semi", T: "Terraced", F: "Flat", O: "Other" };
    const doc = `# Valuation Model Validation (measured)

> Generated by the out-of-time backtest on real HM Land Registry \`price_paid_data\`.
> Model: \`${MODEL_VERSION}\`. Targets sampled deterministically (${PER_OUTWARD}/outward,
> ${OUTWARDS.join(", ")}) over ${FROM}..${TO}. Each target valued as of its own sale
> date using only earlier sales, excluding itself. No future leakage; no self-comparable.
>
> These are MEASURED results, not targets. They reflect a v1.0.0 area+type comparable
> model with no floor area, no bedrooms in the data, and proximity by postcode/street
> proxy (no gazetteer yet) — so errors are expected to be wide. Do not quote an
> "accuracy %"; quote these distributions.

## Headline (overall)

| Metric | Value |
|---|---|
| Targets evaluated | ${overall.n} |
| Produced an estimate | ${overall.nEstimated} |
| No-estimate rate | ${overall.noEstimateRatePct.toFixed(1)}% |
| Median absolute % error (MdAPE) | ${overall.medianAPEPct.toFixed(1)}% |
| Mean absolute % error (MAPE) | ${overall.meanAPEPct.toFixed(1)}% |
| Mean absolute error (MAE) | £${overall.maePounds.toLocaleString()} |
| Log-price RMSE | ${overall.logRMSE.toFixed(3)} |
| Within 5% | ${overall.within5Pct.toFixed(1)}% |
| Within 10% | ${overall.within10Pct.toFixed(1)}% |
| Within 20% | ${overall.within20Pct.toFixed(1)}% |
| Range coverage (actual inside range) | ${overall.rangeCoveragePct.toFixed(1)}% |
| Median range width | ${overall.medianRangeWidthPct.toFixed(0)}% of estimate |

## By property type
${groupTable(rows, (r) => typeName[r.type] ?? r.type)}

## By price band
${groupTable(rows, (r) => r.priceBand)}

## By evidence quality
${groupTable(rows, (r) => r.evidence)}

## By region (outward code)
${groupTable(rows, (r) => r.outward)}

## With vs without a matched prior sale
${groupTable(rows, (r) => (r.hasPriorSale ? "has prior sale" : "no prior sale"))}

## Known weak segments & honest reading

- The central estimate is **area+type level**, not property level, until the OS UPRN
  gazetteer (true distance) and user-supplied bedrooms/floor area sharpen it.
- Range coverage tells you whether the honest range is wide enough; if it is well
  below ~80% the range is too narrow and should be widened (or evidence downgraded).
- Segments with high MdAPE (often <£250k flats sharing a building, or low-volume
  outwards) should be routed to Level D/E and an agent valuation, not given a
  confident number.

_Backtest is reproducible: same model version + same target sample → same metrics._
`;

    const out = join(process.cwd(), "docs/VALUATION_MODEL_VALIDATION.md");
    writeFileSync(out, doc, "utf8");

    console.log(
      `[VMP backtest] n=${overall.n} est=${overall.nEstimated} MdAPE=${overall.medianAPEPct.toFixed(1)}% ` +
        `within20=${overall.within20Pct.toFixed(0)}% coverage=${overall.rangeCoveragePct.toFixed(0)}% ` +
        `medWidth=${overall.medianRangeWidthPct.toFixed(0)}%`,
    );

    // Reproducibility: a small re-run of the first target gives an identical estimate.
    const t0 = targets[0];
    const subject0: ValuationSubject = {
      postcode: t0.postcode, outwardCode: t0.outwardCode, propertyType: t0.propertyType,
      tenure: t0.tenure, newBuild: t0.newBuild, bedrooms: null, bathrooms: null,
      floorAreaSqm: null, condition: null, paon: t0.paon, saon: t0.saon, street: t0.street,
    };
    const a = await calculateValuation({ subject: subject0, valuationDate: t0.saleDate, asOfDate: t0.saleDate, excludeTransactionId: t0.transactionId });
    const b = await calculateValuation({ subject: subject0, valuationDate: t0.saleDate, asOfDate: t0.saleDate, excludeTransactionId: t0.transactionId });
    expect(a.estimatedValue).toBe(b.estimatedValue);
  }, 600_000);
});
