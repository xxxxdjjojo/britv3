# Valuation Data Quality Audit

**Date:** 2026-06-18
**Source under audit:** `public.price_paid_data` (HM Land Registry Price Paid Data, ~31,092,167 rows) on the remote Supabase Postgres DB, plus supporting sources (postcodes.io, `properties`, `listings`).

**Methodology / honesty note:** The table is ~31M rows behind an ~8s statement timeout. Every figure below comes from either (a) a single-outward-code query (full-population *for that area*), or (b) `TABLESAMPLE SYSTEM (n)` (a random ~n% block sample — re-running gives slightly different counts). **No figure here is a full-population aggregate over all 31M rows** except `max(date_of_transfer)`, which the area+date index can satisfy. Each result is shown inline with the exact SQL that produced it.

---

## 1. Coverage

```sql
SELECT min(date_of_transfer), max(date_of_transfer), count(*)
FROM price_paid_data WHERE outward_code='SW18';
-- 1995-01-03 | 2026-02-20 | 47594  (SW18, full-population for area)
```

- Temporal coverage spans **1995 → 2026** consistently across every England/Wales area sampled.
- Geographic coverage: **England & Wales only.** Confirmed below.

## 2. Latest available date

```sql
SELECT max(date_of_transfer) FROM price_paid_data;
-- 2026-02-27 00:00:00
```

Latest transfer is **2026-02-27**, i.e. data is ~3.5 months behind "today" (2026-06-18). This lag is normal for HMLR PPD (registration delay + monthly publication). **Implication:** the most recent ~3 months of market movement is not yet in the dataset; very recent valuations rely on extrapolation.

## 3. Missing-value rate per key column

`TABLESAMPLE SYSTEM (0.05)` over ~16,290 rows:

```sql
SELECT count(*) n,
  count(*) FILTER (WHERE postcode IS NULL)      AS pc_null,
  count(*) FILTER (WHERE paon IS NULL)          AS paon_null,
  count(*) FILTER (WHERE saon IS NULL)          AS saon_null,
  count(*) FILTER (WHERE street IS NULL)        AS street_null,
  count(*) FILTER (WHERE locality IS NULL)      AS locality_null,
  count(*) FILTER (WHERE town IS NULL)          AS town_null,
  count(*) FILTER (WHERE outward_code IS NULL)  AS outward_null
FROM price_paid_data TABLESAMPLE SYSTEM (0.05);
-- n=16290 | pc_null=20 | paon_null=1 | saon_null=14343 | street_null=232 | locality_null=6422 | town_null=0 | outward_null=20
```

| Column | Null rate *(sampled)* | Assessment |
|---|---|---|
| `postcode` | ~0.12% (20/16,290) | Excellent. Geo join almost always possible. |
| `outward_code` | ~0.12% (20/16,290) | Tracks `postcode` (derived from it). |
| `paon` | ~0.006% (1/16,290) | Excellent. Address core present. |
| `street` | ~1.4% (232/16,290) | Good. |
| `town` | ~0% (0/16,290) | Excellent. |
| `locality` | ~39% (6,422/16,290) | Frequently blank — display only, not a join risk. |
| `saon` | ~88% (14,343/16,290) | **Mostly null — expected** (only flats/units have a SAON). See §6. |

## 4. Geographic coverage spread (England / Wales / Scotland)

```sql
-- one query per outward code:
SELECT count(*) FROM price_paid_data WHERE outward_code = :oc;
```

| Outward | Place | Country | Rows |
|---|---|---|---|
| `SW18` | Wandsworth, London | England | 47,594 |
| `SW17` | Tooting, London | England | 37,575 |
| `M1` | Manchester | England | 12,762 |
| `B1` | Birmingham | England | 9,758 |
| `LS1` | Leeds | England | 4,601 |
| `CF10` | Cardiff | **Wales** | 13,150 |
| `LL57` | Bangor | **Wales** | 10,870 |
| `EH1` | Edinburgh | **Scotland** | **0** |
| `G1` | Glasgow | **Scotland** | **0** |
| `G2` | Glasgow | **Scotland** | **0** |

**Finding (real limitation):** England and Wales are well-covered; **Scotland returns zero rows**. HMLR PPD does not include Scotland (covered separately by Registers of Scotland). Any Scottish postcode will geocode successfully via postcodes.io yet yield **no comparables** — this must be surfaced to the user, not silently returned as "no data."

## 5. `ppd_category = 'B'` proportion (non-open-market — exclude from comparables)

Per-area, full-population for the area:

```sql
SELECT count(*) tot, count(*) FILTER (WHERE ppd_category='B') catB
FROM price_paid_data WHERE outward_code = :oc;
```

| Area | Total | Category B | B share |
|---|---|---|---|
| SW17 | 37,575 | 1,580 | 4.2% |
| M1 | 12,762 | 1,574 | 12.3% |
| B1 | 9,758 | 1,631 | 16.7% |
| LS1 | 4,601 | 733 | 15.9% |
| CF10 | 13,150 | 1,379 | 10.5% |

Recent window, SW18:

```sql
SELECT count(*) tot, count(*) FILTER (WHERE ppd_category='B') catB
FROM price_paid_data WHERE outward_code='SW18' AND date_of_transfer >= '2020-01-01';
-- 8256 | 812   (9.8%)
```

National sampled estimate `TABLESAMPLE SYSTEM (0.05)`: A 14,741 / B 827 → ~5.3%.

**Finding:** Category B is material and varies widely by area — from ~4% (suburban London) to ~17% (B1, LS1 city-centre). City-centre / new-build-heavy areas carry far more bulk/non-market transfers. **Failing to exclude `B` would bias valuations** (B records include repossessions and below-market bulk transfers). Always filter `ppd_category = 'A'`.

## 6. `saon` and the flats-share-PAON issue

```sql
SELECT property_type, count(*) tot, count(*) FILTER (WHERE saon IS NULL) saon_null
FROM price_paid_data WHERE outward_code='SW18' GROUP BY property_type ORDER BY 2 DESC;
-- F 29816 / 14072 null | T 14076 / 13941 null | S 2492 / 2458 null | O 677 / 458 null | D 533 / 519 null
```

- Houses (`T`/`S`/`D`): SAON ~98–99% null (a house has no sub-unit) — correct.
- Flats (`F`): SAON null in ~47% of SW18 flats — i.e. **only about half of flats carry a SAON**, even though most flats *should* have one (the flat number).

Example flat block (multiple flats sharing one PAON, distinguished only by SAON):

```sql
SELECT paon, saon, duration, property_type, count(*) FROM price_paid_data
WHERE outward_code='SW18' AND property_type='F' AND saon IS NOT NULL
GROUP BY paon,saon,duration,property_type ORDER BY count(*) DESC LIMIT 5;
-- 20 | FLAT 2 | L | F | 20
-- 54 | FLAT 1 | L | F | 18
-- 11 | FLAT A | L | F | 18
-- 1  | FLAT B | L | F | 17
```

**Finding:** Leasehold flats commonly share a single PAON (the building) and are separated only by SAON. Where SAON is null on a flat, distinct dwellings collapse into one apparent address. **Address-level matching for flats is unreliable** unless both PAON and SAON are present; otherwise flats can only be treated at building level.

## 7. Duplicate-address indication (repeat sales)

```sql
SELECT count(*) addr_rows,
       count(DISTINCT (postcode,paon,coalesce(saon,''))) distinct_addr
FROM price_paid_data WHERE outward_code='SW18';
-- 47594 | 21700
```

**Finding:** SW18 has 47,594 transaction rows but only ~21,700 distinct `(postcode,paon,saon)` addresses → on average ~2.2 sales per address since 1995. This is **expected repeat-sales behaviour, not data corruption** — the same property sells multiple times over 30 years. But it means:
- Naïve "count of sales" ≠ "count of properties."
- An address-history query can and should return multiple rows; the most recent open-market `A` sale is the headline comparable.
- True duplicates (same transfer twice) are guarded by the `transaction_id` PK and were not observed.

## 8. `record_status` deletion proportion

```sql
SELECT record_status, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.1) GROUP BY record_status;
-- A 30766   (no 'C' or 'D' rows in the ~30k-row sample)
```
Per-area `count(*) FILTER (WHERE record_status <> 'A')` was **0** for SW17, M1, B1, LS1, CF10.

**Finding:** The snapshot is effectively all `record_status = 'A'` (additions). The `C`/`D` change/delete records from HMLR's monthly update files are not retained in this table, so `record_status` filtering is currently a no-op but should stay in queries defensively for future incremental loads.

## 9. Price sanity

```sql
SELECT min(price), max(price), round(avg(price)),
       percentile_disc(0.5) WITHIN GROUP (ORDER BY price) median
FROM price_paid_data WHERE outward_code='SW18' AND ppd_category='A';
-- 1 | 9900000 | 473531 | 365000
```

**Finding:** `price` is in whole pounds (no decimals). The min of **£1** confirms outliers exist even within category A (peppercorn/related-party transfers, partial-share, errors). The mean (£473k) sits well above the median (£365k) — right-skewed, as expected for property. **Implication:** AVM must use median or trimmed/robust statistics, not mean; and should apply sane price floors/ceilings to reject £1-type outliers.

---

## 10. Address-as-property warning (critical)

> **A postcode is not a property.**

A single UK postcode typically covers **15–30 dwellings**, and an outward code (e.g. `SW18`) covers tens of thousands of transactions (47,594 for SW18). Returning a "valuation for SW18 1AB" without an exact address is an **area-level estimate**, not a property valuation.

Required product behaviour:
1. If the user supplies only a postcode (or only an outward code), the result **must be labelled area-level** (e.g. "median of N nearby sales"), never presented as "your property is worth £X."
2. To produce a property-level figure, the user **must select an exact address** — i.e. a specific `(postcode, paon[, saon])`. For flats this **requires SAON**; if SAON is missing, the best achievable granularity is building-level and must be stated as such.
3. When the address resolves to a Scottish postcode (geocodes fine but PPD returns 0 rows), tell the user **"no Land Registry sales data is available for Scotland,"** rather than returning an empty/zero valuation.
4. Repeat sales mean a chosen address legitimately has a sale *history*; use the most recent open-market (`ppd_category='A'`) transfer as the anchor, time-aware.

---

## 11. Known limitations (summary)

| Limitation | Consequence |
|---|---|
| **No floor area (m²)** — EPC present only as rating/score on `properties`; no size dataset | Cannot compute £/m²; comparables limited to type+tenure+location+recency |
| **No UPRN** | No authoritative property join; matching is text-based and fuzzy |
| **No HPI table** | No published index to time-adjust older comparables |
| **Scotland absent** | Scottish postcodes geocode but yield zero comparables |
| **Leasehold flats share PAON** | Flat-level matching unreliable without SAON (~47% of SW18 flats lack SAON) |
| **New-build premium** | `old_new='Y'` (~10% of stock) sells at a premium; mixing inflates established-stock valuations |
| **Area, not address, granularity by default** | Postcode/outward results are area estimates, not property valuations |
| **~3.5-month data lag** | Latest transfer 2026-02-27; recent market shifts not yet captured |
| **Category B materially varies (4–17%)** | Must exclude `ppd_category='B'` or valuations are biased by non-market transfers |
| **Right-skewed prices with £1 outliers** | Use median/robust stats and price-sanity floors, never the mean |

---

## 12. Appendix — every query run for this audit

```sql
-- coverage / latest
SELECT max(date_of_transfer) FROM price_paid_data;
SELECT min(date_of_transfer), max(date_of_transfer), count(*) FROM price_paid_data WHERE outward_code='SW18';
-- null rates
SELECT count(*) n, count(*) FILTER (WHERE postcode IS NULL), count(*) FILTER (WHERE paon IS NULL),
  count(*) FILTER (WHERE saon IS NULL), count(*) FILTER (WHERE street IS NULL),
  count(*) FILTER (WHERE locality IS NULL), count(*) FILTER (WHERE town IS NULL),
  count(*) FILTER (WHERE outward_code IS NULL)
FROM price_paid_data TABLESAMPLE SYSTEM (0.05);
-- distributions
SELECT property_type, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.05) GROUP BY property_type ORDER BY 2 DESC;
SELECT old_new, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.05) GROUP BY old_new;
SELECT duration, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.05) GROUP BY duration;
SELECT ppd_category, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.05) GROUP BY ppd_category;
SELECT record_status, count(*) FROM price_paid_data TABLESAMPLE SYSTEM (0.1) GROUP BY record_status;
-- per-area B share + status + coverage (SW17,M1,B1,LS1,EH1,CF10)
SELECT count(*) tot, count(*) FILTER (WHERE ppd_category='B') catB,
       count(*) FILTER (WHERE record_status<>'A') nonAstatus,
       min(date_of_transfer)::date, max(date_of_transfer)::date
FROM price_paid_data WHERE outward_code = :oc;
-- recent B share
SELECT count(*) tot, count(*) FILTER (WHERE ppd_category='B') catB
FROM price_paid_data WHERE outward_code='SW18' AND date_of_transfer >= '2020-01-01';
-- Scotland/Wales probe
SELECT count(*) FROM price_paid_data WHERE outward_code IN ('EH1','G1','G2','CF10','LL57','SW1A');
-- duplicate addresses
SELECT count(*) addr_rows, count(DISTINCT (postcode,paon,coalesce(saon,''))) distinct_addr
FROM price_paid_data WHERE outward_code='SW18';
-- flats share PAON
SELECT paon, saon, duration, property_type, count(*) FROM price_paid_data
WHERE outward_code='SW18' AND property_type='F' AND saon IS NOT NULL
GROUP BY paon,saon,duration,property_type ORDER BY count(*) DESC LIMIT 5;
-- saon null by type
SELECT property_type, count(*) tot, count(*) FILTER (WHERE saon IS NULL) saon_null
FROM price_paid_data WHERE outward_code='SW18' GROUP BY property_type ORDER BY 2 DESC;
-- price sanity
SELECT min(price), max(price), round(avg(price)),
       percentile_disc(0.5) WITHIN GROUP (ORDER BY price) median
FROM price_paid_data WHERE outward_code='SW18' AND ppd_category='A';
```
