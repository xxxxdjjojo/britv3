# Valuation Model Spec — comparable-sales engine

> **Date:** 2026-06-18
> **Model version:** `vmp-comparables-1.0.0`
> **Status:** Specification (gates engine implementation). Honours
> `VALUATION_SCAFFOLDING.md`, `VALUATION_DATA_DICTIONARY.md`,
> `VALUATION_DATA_QUALITY_AUDIT.md`, `VALUATION_COMPETITOR_RESEARCH.md`.
>
> **Result is an _indicative automated estimate_** — never a guaranteed price,
> survey, or mortgage valuation. No accuracy figure is published until measured
> on held-out sales (`VALUATION_MODEL_VALIDATION.md`).

## 0. Non-negotiable principles

1. **No hardcoded unexplained multipliers.** Every constant (radius steps, time
   windows, weight half-lives, trim fraction, new-build cap, price floor/ceiling,
   minimum comparable counts) is named, documented in §12, unit-tested, and
   bumped with `model_version`.
2. **Robust statistics only.** Prices are right-skewed with £1 outliers
   (Audit §9). Use weighted median + trimmed mean, never the raw mean.
3. **Honest granularity.** A postcode is not a property (Audit §10). An estimate
   built without an exact `(postcode, paon[, saon])` is area-level and labelled
   as such.
4. **Time-adjust transparently.** Older comparables are indexed to the valuation
   date via a documented public HPI; the formula is in §4.
5. **Fallback, never fabricate.** When evidence is insufficient, drop to a lower
   fallback level and ultimately recommend a human agent (level E) — do not
   invent a number.

## 1. Inputs

### 1.1 Subject inputs (from the journey, see `VALUATION_UX_FLOW.md`)

| Input | Source | Used for |
|---|---|---|
| `postcode` (full unit) | address step | geo scope, exact match |
| `paon` / `saon` | address step (or PPD-derived candidate) | exact-address anchor, flat disambiguation |
| `latitude` / `longitude` | postcodes.io geocode | distance weighting, map |
| `outward_code` | derived from postcode | index-backed candidate scope (`ppd_outward_date_idx`) |
| `property_type` (D/S/T/F/O) | details step | like-for-like filter + type weight |
| `duration` (F/L tenure) | details step | tenure filter (don't mix L-flat with F-house) |
| `bedrooms` | details step | bedroom-distance weight (PPD has no beds → uses subject self-report vs comparable address history where available; otherwise neutral) |
| `floor_area_m2` (optional) | details step | floor-area weight **only when present on both sides**; PPD has no size, so usually absent |
| `old_new` intent (new build?) | details step | new-build mixing control |
| `condition`, `extension/loft`, `parking`, `garden` | details step | NOT model features in 1.0.0 — recorded for evidence display + future versions; documented in §11 |

### 1.2 Market inputs

- `public.price_paid_data` — comparable + prior-sale source (Dictionary §1).
  Price in **whole pounds**; columns `property_type`, `old_new`, `duration`,
  `ppd_category`, `record_status`, `paon/saon/street/postcode/outward_code/date_of_transfer`.
- UK House Price Index (HPI), gov.uk, OGL — time-adjustment index to ingest
  (§4). Not yet present (`hpi` table absent — Dictionary §4); until ingested the
  engine MUST run with `index = 1.0` everywhere and set `evidence_quality` no
  higher than `medium` (the time-adjustment is then a no-op, documented as such).

## 2. Candidate comparable selection

Applied in order; each rule is a documented constant in §12.

1. **Base filter (canonical, Dictionary §5):**
   ```sql
   ppd_category = 'A'          -- exclude non-open-market B (Audit §5, 4–17%)
   AND record_status = 'A'     -- exclude change/delete D/C (Audit §8)
   AND property_type = :broad_type
   AND duration = :tenure      -- only when tenure is material (see 2a)
   AND date_of_transfer >= :since
   AND outward_code = :oc      -- index-backed; widened by radius steps below
   ```
2. **Broad type matching.** Match the same broad PPD type (D/S/T/F/O). `O`
   (other) never anchors a residential estimate — if subject is `O`, go to
   fallback level D/E.
3. **Tenure where material.** Enforce `duration = :tenure` for flats (`F`, almost
   always leasehold) and where the subject tenure is known. For houses where
   tenure is unknown, tenure is a weight (§3) not a hard filter, because
   freehold/leasehold houses coexist.
4. **Adaptive radius.** Start with `outward_code` (index path). If
   `effective_comparable_count` (§5) `< MIN_EFFECTIVE_COMPS`, widen by distance
   ring using lat/long: `RADIUS_STEPS_KM = [0 (same outward), 1, 2, 5]`. Stop at
   the first step that meets `MIN_EFFECTIVE_COMPS`, or at the last step.
5. **Recency window.** Prefer `RECENCY_PREFERRED_MONTHS = 12–24`; widen to
   `RECENCY_MAX_MONTHS = 36` only if a step is short of comps. Never exceed 36
   months for the headline estimate (older sales are too index-dependent).
6. **Outlier rejection (price-sanity).** Drop rows with
   `price < PRICE_FLOOR (£10,000)` or `price > PRICE_CEILING (£25,000,000)`
   (kills £1 peppercorn/related-party transfers, Audit §9), then drop rows
   outside `[Q1 − 1.5·IQR, Q3 + 1.5·IQR]` of the candidate set (robust Tukey
   fence). Both bounds are constants in §12.
7. **New-build mixing control.** When valuing established stock (`old_new='N'`
   intent), cap new-build (`old_new='Y'`) comparables at
   `NEW_BUILD_MAX_SHARE = 0.20` of the set (they carry a premium, Audit §11).
   When valuing a new build, prefer new-build comps and flag the thin-evidence
   risk.
8. **De-duplication.** One row per `(postcode, paon, coalesce(saon,''))` —
   keep the most recent qualifying sale (repeat-sales are expected, Audit §7).

## 3. Similarity weight

Each surviving comparable `c` gets a weight `w(c)` = product of independent
factors in `[0,1]`. Every half-life / scale is a §12 constant.

| Factor | Form | Notes |
|---|---|---|
| Distance | `exp(-d_km / DIST_HALFLIFE_KM)` | `DIST_HALFLIFE_KM = 1.0`; `d_km` = haversine subject↔comparable postcode |
| Recency | `exp(-months / RECENCY_HALFLIFE_MO)` | `RECENCY_HALFLIFE_MO = 12`; on **index-adjusted** date distance |
| Type | exact broad-type = 1; else 0 | already hard-filtered, kept for auditability |
| Bedroom | `exp(-abs(Δbeds) / BED_SCALE)` | `BED_SCALE = 1.5`; neutral (=1) when beds unknown on either side |
| Floor area | `exp(-abs(Δm²)/m²_subject / AREA_SCALE)` | `AREA_SCALE = 0.25`; **applied only when both have floor area**, else =1 |
| Tenure | match = 1; mismatch = `TENURE_PENALTY` | `TENURE_PENALTY = 0.5` (used only when tenure is a weight not a filter) |
| New-build | subject/comp `old_new` match = 1; mismatch = `NEWBUILD_PENALTY` | `NEWBUILD_PENALTY = 0.6` |

`w(c) = clamp(product, 0, 1)`. Weights are normalised before the median.

## 4. Time-adjustment

Each comparable price is indexed to the valuation date:

```
adjusted_price(c) = historic_price(c) × index_at(valuation_date) / index_at(sale_date(c))
```

- **Index source to ingest:** UK House Price Index, gov.uk
  (`https://www.gov.uk/government/statistics/uk-house-price-index-...`), Open
  Government Licence v3.0. Attribution: "Contains HM Land Registry data © Crown
  copyright and database right 2026, licensed under the OGL v3.0."
- **Granularity:** use the most specific available series in priority order —
  local-authority `district` → region → national — recording which was used in
  `inputs_used.hpi_series`.
- **Lag handling:** HPI itself lags. For the most recent
  `~DATA_LAG_MONTHS = 3.5` months (PPD lag, Audit §2) the index is held at its
  latest published value (no extrapolation), and this is disclosed in the
  evidence note.
- **Until HPI is ingested:** `index_at(...) = 1.0` everywhere (no-op), capping
  `evidence_quality` at `medium` per §1.

## 5. Robust estimator and range

Let the post-filter, time-adjusted, weighted set be `{(adjusted_price_i, w_i)}`.

- `effective_comparable_count = (Σ w_i)² / Σ w_i²` (Kish effective sample size).
- **Point estimate:** blend of two robust estimators —
  `estimate = ESTIMATOR_MEDIAN_WEIGHT · weightedMedian + (1 − ESTIMATOR_MEDIAN_WEIGHT) · trimmedMean`,
  with `ESTIMATOR_MEDIAN_WEIGHT = 0.6` and `TRIM_FRACTION = 0.10` (drop top/bottom
  10% by adjusted price before the weighted mean). Both constants in §12.
- **Rounding:** `estimated_value = round(estimate / 5000) · 5000` (nearest £5,000).
- **Range:** derived from the weighted interquartile spread of adjusted prices,
  widened for thin evidence:
  ```
  spread = weightedQuantile(0.75) − weightedQuantile(0.25)
  half   = max(spread/2, estimate × RANGE_MIN_FRACTION) × THIN_EVIDENCE_FACTOR(effective_n)
  estimated_low  = round((estimate − half)/5000)·5000
  estimated_high = round((estimate + half)/5000)·5000
  ```
  `RANGE_MIN_FRACTION = 0.05`; `THIN_EVIDENCE_FACTOR` = 1.0 at high evidence,
  rising to `THIN_EVIDENCE_FACTOR_MAX = 1.8` as `effective_n` approaches the
  minimum. **This is NOT a calibrated confidence interval** — it is labelled
  "Estimated range based on comparable sales and model uncertainty" until
  back-tested (`VALUATION_COMPETITOR_RESEARCH.md` §3C; Scaffolding §10).

## 6. Fallback hierarchy (A–E)

Evaluated top-down; the first matching level is returned.

| Level | Trigger condition | Behaviour |
|---|---|---|
| **A** | Exact address resolved `(postcode,paon[,saon])` **and** a prior open-market (`A`) sale for that address within `RECENCY_MAX_MONTHS` **and** `effective_n ≥ MIN_EFFECTIVE_COMPS_STRONG (8)` | Anchor on the index-adjusted prior sale, refined by weighted comparables; narrowest range |
| **B** | Exact address resolved **and** `effective_n ≥ MIN_EFFECTIVE_COMPS (5)`, but no usable prior sale | Comparable-only property-level estimate |
| **C** | No exact address (postcode/area only) **and** `effective_n ≥ MIN_EFFECTIVE_COMPS (5)` | **Area-level** estimate, explicitly labelled "median of N nearby sales", wider range |
| **D** | `MIN_COMPS_FLOOR (3) ≤ effective_n < MIN_EFFECTIVE_COMPS (5)`, or subject type `O`, or new-build with only mixed comps | Low-confidence indicative figure with widest range and prominent caveat; strongly suggest agent |
| **E** | `effective_n < MIN_COMPS_FLOOR (3)`, or Scottish postcode (PPD returns 0, Audit §4), or no responsible estimate possible | **No estimate.** Return reason + recommend a human agent valuation |

`fallback_level` is returned; the UX adapts copy and range width to it.

## 7. Evidence-quality classifier

Independent of (but correlated with) fallback level; drives the result-page badge.

| `evidence_quality` | Condition |
|---|---|
| `high` | exact address, `effective_n ≥ 8`, HPI ingested & series ≤ region, recency median ≤ 18mo, low price dispersion (IQR/estimate ≤ `DISPERSION_HIGH = 0.25`) |
| `medium` | `effective_n ≥ 5`, OR all of `high` met **except** HPI not yet ingested (index no-op), OR recency median ≤ 30mo |
| `low` | `effective_n` in `[3,5)`, or dispersion `> DISPERSION_LOW = 0.5`, or area-level only, or heavy new-build mixing |
| `unavailable` | fallback level E (no estimate) |

## 8. Return shape

```ts
type ValuationResult = {
  subject_property_id: string;        // stable id for the subject (address-derived)
  valuation_id: string;               // uuid; persisted, attached to verified user
  model_version: "vmp-comparables-1.0.0";
  estimated_value: number | null;     // GBP, nearest £5,000; null at level E
  estimated_low: number | null;       // GBP, nearest £5,000; null at level E
  estimated_high: number | null;      // GBP, nearest £5,000; null at level E
  evidence_quality: "high" | "medium" | "low" | "unavailable";
  fallback_level: "A" | "B" | "C" | "D" | "E";
  comparable_count: number;           // raw rows after filtering
  effective_comparable_count: number; // Kish effective n (§5)
  valuation_date: string;             // ISO date the estimate was produced
  data_cutoff_date: string;           // max(date_of_transfer) used (≈3.5mo lag)
  inputs_used: Record<string, unknown>;   // every subject + market input applied
  missing_inputs: string[];           // requested-but-absent inputs (e.g. floor_area_m2, hpi)
  comparable_sales: ComparableSale[]; // evidence shown to the user
};

type ComparableSale = {
  address_label: string;   // e.g. "12 Example Rd, SW18 1AB" or building-level for SAON-less flats
  price: number;           // historic sale price, whole £
  adjusted_price: number;  // after time-adjustment (§4)
  date_of_transfer: string;
  property_type: "D"|"S"|"T"|"F"|"O";
  duration: "F"|"L";
  old_new: "Y"|"N";
  distance_km: number;
  weight: number;          // normalised similarity weight (§3)
};
```

## 9. Algorithm summary (pseudocode)

```
1. resolve subject address → granularity (exact | building | area)
2. if Scottish postcode → level E (no PPD), return unavailable
3. for step in RADIUS_STEPS_KM:
     candidates = query PPD with base filter (§2) at this radius + recency window
     candidates = price-sanity + Tukey-fence outlier drop (§2.6)
     candidates = newbuild-share cap (§2.7) + dedupe (§2.8)
     adjusted   = time-adjust each (§4)
     weights    = similarity weight each (§3)
     effective_n = Kish(weights)
     if effective_n ≥ MIN_EFFECTIVE_COMPS: break
4. widen recency to RECENCY_MAX_MONTHS once if still short
5. choose fallback level (§6) from granularity + prior sale + effective_n
6. if level E → return null estimate + reason + agent recommendation
7. estimate = robust blend (§5); round; derive range (§5)
8. evidence_quality = classify (§7)
9. assemble ValuationResult (§8)
```

## 10. Persistence

The result is persisted under `valuation_id` and attached to the **verified
user only** (Scaffolding §6). `model_version`, `inputs_used`, and
`data_cutoff_date` are stored so any historical estimate is reproducible and
auditable when constants change.

## 11. Recorded-but-unused inputs (1.0.0)

`condition`, `extension/loft`, `parking/garage`, `garden`, and `bathrooms` are
collected for evidence display and future model versions but are **not** weight
factors in 1.0.0 (PPD has no matching field to calibrate them against). This is
explicit, not an omission — adding them is a `model_version` bump gated on a
data source that supports them.

## 12. Constants register (every number, one place)

| Constant | Value | Rationale / source |
|---|---|---|
| `RADIUS_STEPS_KM` | `[0,1,2,5]` | start index-backed outward, widen minimally (Dictionary §1 index path) |
| `RECENCY_PREFERRED_MONTHS` | `12–24` | balance freshness vs sample size |
| `RECENCY_MAX_MONTHS` | `36` | older sales too index-dependent |
| `DATA_LAG_MONTHS` | `3.5` | PPD publication lag (Audit §2) |
| `PRICE_FLOOR` | `£10,000` | reject £1 peppercorn/related-party (Audit §9) |
| `PRICE_CEILING` | `£25,000,000` | reject data-entry extremes |
| `NEW_BUILD_MAX_SHARE` | `0.20` | limit new-build premium bleed (Audit §11) |
| `DIST_HALFLIFE_KM` | `1.0` | local comparability |
| `RECENCY_HALFLIFE_MO` | `12` | recent sales weigh more |
| `BED_SCALE` | `1.5` | bedroom similarity decay |
| `AREA_SCALE` | `0.25` | floor-area similarity decay (when present) |
| `TENURE_PENALTY` | `0.5` | soft tenure mismatch (houses only) |
| `NEWBUILD_PENALTY` | `0.6` | new vs established mismatch |
| `TRIM_FRACTION` | `0.10` | trimmed-mean robustness (Audit §9) |
| `ESTIMATOR_MEDIAN_WEIGHT` | `0.6` | median-leaning robust blend |
| `RANGE_MIN_FRACTION` | `0.05` | floor on range half-width |
| `THIN_EVIDENCE_FACTOR_MAX` | `1.8` | widen range when evidence thin |
| `DISPERSION_HIGH` | `0.25` | high-quality dispersion ceiling |
| `DISPERSION_LOW` | `0.5` | low-quality dispersion floor |
| `MIN_COMPS_FLOOR` | `3` | below this → level E (no estimate) |
| `MIN_EFFECTIVE_COMPS` | `5` | minimum for a responsible estimate |
| `MIN_EFFECTIVE_COMPS_STRONG` | `8` | strong-evidence / level-A threshold |

All constants live in one versioned module (e.g.
`src/services/valuation/model-constants.ts`), are imported everywhere (no inline
literals), and each has at least one unit test asserting its effect.
</content>
</invoke>
