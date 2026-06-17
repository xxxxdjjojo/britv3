import "server-only";
import wandsworthGeo from "@/data/geo/wandsworth-postcode-districts.json";
import { getMarketMapPool } from "@/lib/market-map/db";
import { assignColours, type ColourInput } from "@/lib/market-map/colour";
import { classifyConfidence } from "@/lib/market-map/confidence";
import { resolveArea } from "@/lib/market-map/areas";
import {
  PROPERTY_TYPE_LABELS,
  propertyTypeCode,
} from "@/lib/market-map/format";
import type {
  AreaSummary,
  MarketMapFeature,
  MarketMapFeatureCollection,
  MarketMapFeatureProperties,
  MarketMapQuery,
  PropertyTypeMix,
  RecentTransaction,
  TrendPoint,
} from "@/types/market-map";

const SOURCE_LABEL =
  "Land Registry transaction data joined to postcode geography";

interface AreaStatsRow {
  outward_code: string;
  txn_count: number;
  median_price: number;
  p10_price: number;
  p90_price: number;
  latest_date: string | null;
  n_d: number;
  n_s: number;
  n_t: number;
  n_f: number;
  n_o: number;
}

const GEOJSON_BY_AREA: Record<string, GeoJSON.FeatureCollection> = {
  wandsworth: wandsworthGeo as unknown as GeoJSON.FeatureCollection,
};

/** Run the per-district aggregation over price_paid_data (read-only). */
async function fetchAreaStats(
  query: MarketMapQuery,
): Promise<AreaStatsRow[]> {
  const borough = resolveArea(query.area);
  const typeCode = propertyTypeCode(query.property_type);

  const sql = `
    select
      outward_code,
      count(*)::int                                                    as txn_count,
      percentile_cont(0.5) within group (order by price)::bigint       as median_price,
      percentile_cont(0.1) within group (order by price)::bigint       as p10_price,
      percentile_cont(0.9) within group (order by price)::bigint       as p90_price,
      max(date_of_transfer)::date                                      as latest_date,
      count(*) filter (where property_type = 'D')::int                 as n_d,
      count(*) filter (where property_type = 'S')::int                 as n_s,
      count(*) filter (where property_type = 'T')::int                 as n_t,
      count(*) filter (where property_type = 'F')::int                 as n_f,
      count(*) filter (where property_type = 'O')::int                 as n_o
    from price_paid_data
    where district = $1
      and outward_code = any($2::text[])
      and ppd_category = 'A'
      and record_status <> 'D'
      and price > 0
      and postcode is not null
      and date_of_transfer >= $3::date
      and date_of_transfer <  ($4::date + interval '1 day')
      and ($5::text is null or property_type = $5)
    group by outward_code
  `;

  const { rows } = await getMarketMapPool().query<AreaStatsRow>(sql, [
    borough.district,
    borough.outwardCodes,
    query.from_date,
    query.to_date,
    typeCode,
  ]);
  return rows;
}

function buildTypeMix(row: AreaStatsRow): PropertyTypeMix {
  const mix: PropertyTypeMix = {};
  const entries: Array<[string, number]> = [
    [PROPERTY_TYPE_LABELS.D, row.n_d],
    [PROPERTY_TYPE_LABELS.S, row.n_s],
    [PROPERTY_TYPE_LABELS.T, row.n_t],
    [PROPERTY_TYPE_LABELS.F, row.n_f],
    [PROPERTY_TYPE_LABELS.O, row.n_o],
  ];
  for (const [label, count] of entries) {
    if (count > 0) mix[label] = count;
  }
  return mix;
}

/**
 * Build the market-map FeatureCollection: aggregate stats per postcode district,
 * join to boundary geometry, and assign a robust local colour scale.
 */
export async function getMarketMap(
  query: MarketMapQuery,
): Promise<MarketMapFeatureCollection> {
  const borough = resolveArea(query.area);
  const stats = await fetchAreaStats(query);
  const statsByArea = new Map(stats.map((r) => [r.outward_code, r]));

  const geo = GEOJSON_BY_AREA[borough.slug] ?? GEOJSON_BY_AREA.wandsworth;
  const geoFeatures = geo.features;

  // Colour inputs in the same order as the geometry features.
  const colourInputs: ColourInput[] = geoFeatures.map((f) => {
    const id = String(f.properties?.area_id ?? "");
    const row = statsByArea.get(id);
    return {
      medianPrice: row ? Number(row.median_price) : 0,
      transactionCount: row ? row.txn_count : 0,
    };
  });
  const colours = assignColours(colourInputs);

  const features: MarketMapFeature[] = geoFeatures.map((f, i) => {
    const id = String(f.properties?.area_id ?? "");
    const name = String(f.properties?.area_name ?? id);
    const row = statsByArea.get(id);
    const count = row ? row.txn_count : 0;

    const properties: MarketMapFeatureProperties = {
      area_id: id,
      area_name: name,
      median_price: row ? Number(row.median_price) : 0,
      transaction_count: count,
      p10_price: row ? Number(row.p10_price) : 0,
      p90_price: row ? Number(row.p90_price) : 0,
      confidence: classifyConfidence(count),
      colour_bucket: colours[i].colourBucket,
      fill_colour: colours[i].fillColour,
      latest_transaction_date: row?.latest_date ?? null,
      date_from: query.from_date,
      date_to: query.to_date,
      type_mix: row ? buildTypeMix(row) : {},
    };

    return { type: "Feature", geometry: f.geometry, properties };
  });

  return {
    type: "FeatureCollection",
    features,
    metadata: {
      metric: "median_sold_price",
      currency: "GBP",
      scale: "local",
      source: SOURCE_LABEL,
      sqm_available: false,
      area: borough.slug,
      area_label: borough.label,
      geography_level: query.geography_level,
      property_type: query.property_type,
      date_from: query.from_date,
      date_to: query.to_date,
    },
  };
}

function summariseCollection(
  query: MarketMapQuery,
  collection: MarketMapFeatureCollection,
  boroughMedian: { median: number | null; count: number },
): AreaSummary {
  const borough = resolveArea(query.area);
  const ranked = collection.features
    .map((f) => f.properties)
    .filter((p) => p.confidence !== "Insufficient")
    .sort((a, b) => a.median_price - b.median_price);

  return {
    area: borough.slug,
    area_label: borough.label,
    median_price: boroughMedian.median,
    transaction_count: boroughMedian.count,
    confidence: classifyConfidence(boroughMedian.count),
    date_from: query.from_date,
    date_to: query.to_date,
    sub_areas: ranked,
  };
}

/** Borough-level summary + ranked sub-areas (cheapest → most expensive). */
export async function getAreaSummary(
  query: MarketMapQuery,
): Promise<AreaSummary> {
  const [collection, boroughMedian] = await Promise.all([
    getMarketMap(query),
    fetchBoroughMedian(query),
  ]);
  return summariseCollection(query, collection, boroughMedian);
}

/** Map FeatureCollection + summary in one pass (single area aggregation). */
export async function getAreaOverview(
  query: MarketMapQuery,
): Promise<{ collection: MarketMapFeatureCollection; summary: AreaSummary }> {
  const [collection, boroughMedian] = await Promise.all([
    getMarketMap(query),
    fetchBoroughMedian(query),
  ]);
  return {
    collection,
    summary: summariseCollection(query, collection, boroughMedian),
  };
}

async function fetchBoroughMedian(
  query: MarketMapQuery,
): Promise<{ median: number | null; count: number }> {
  const borough = resolveArea(query.area);
  const typeCode = propertyTypeCode(query.property_type);
  const sql = `
    select
      count(*)::int                                              as count,
      percentile_cont(0.5) within group (order by price)::bigint as median
    from price_paid_data
    where district = $1
      and outward_code = any($2::text[])
      and ppd_category = 'A'
      and record_status <> 'D'
      and price > 0
      and postcode is not null
      and date_of_transfer >= $3::date
      and date_of_transfer <  ($4::date + interval '1 day')
      and ($5::text is null or property_type = $5)
  `;
  const { rows } = await getMarketMapPool().query<{
    count: number;
    median: number | null;
  }>(sql, [
    borough.district,
    borough.outwardCodes,
    query.from_date,
    query.to_date,
    typeCode,
  ]);
  const row = rows[0];
  return {
    median: row?.median != null ? Number(row.median) : null,
    count: row?.count ?? 0,
  };
}

/** Recent transactions for the borough (optionally a single sub-area). */
export async function getRecentTransactions(
  query: MarketMapQuery,
  options: { subArea?: string; limit?: number } = {},
): Promise<RecentTransaction[]> {
  const borough = resolveArea(query.area);
  const limit = Math.min(options.limit ?? 12, 50);
  const outwardCodes = options.subArea
    ? [options.subArea.toUpperCase()]
    : borough.outwardCodes;
  const typeCode = propertyTypeCode(query.property_type);

  const sql = `
    select
      transaction_id     as id,
      price,
      date_of_transfer::date as date,
      postcode,
      outward_code,
      property_type,
      paon,
      street,
      town
    from price_paid_data
    where district = $1
      and outward_code = any($2::text[])
      and ppd_category = 'A'
      and record_status <> 'D'
      and price > 0
      and postcode is not null
      and date_of_transfer >= $3::date
      and date_of_transfer <  ($4::date + interval '1 day')
      and ($5::text is null or property_type = $5)
    order by date_of_transfer desc, transaction_id desc
    limit $6
  `;
  const { rows } = await getMarketMapPool().query<{
    id: string;
    price: number;
    date: string;
    postcode: string | null;
    outward_code: string | null;
    property_type: string;
    paon: string | null;
    street: string | null;
    town: string | null;
  }>(sql, [
    borough.district,
    outwardCodes,
    query.from_date,
    query.to_date,
    typeCode,
    limit,
  ]);

  return rows.map((r) => ({
    id: r.id,
    price: Number(r.price),
    date: r.date,
    postcode: r.postcode,
    outward_code: r.outward_code,
    property_type: PROPERTY_TYPE_LABELS[r.property_type?.trim()] ?? "Other",
    street: r.street,
    paon: r.paon,
    town: r.town,
  }));
}

/** Median sold price by quarter for the area-evolution chart. */
export async function getAreaTrend(
  query: MarketMapQuery,
): Promise<TrendPoint[]> {
  const borough = resolveArea(query.area);
  const typeCode = propertyTypeCode(query.property_type);
  const sql = `
    select
      to_char(date_trunc('quarter', date_of_transfer), 'YYYY"-Q"Q')   as period,
      percentile_cont(0.5) within group (order by price)::bigint      as median_price,
      count(*)::int                                                   as transaction_count
    from price_paid_data
    where district = $1
      and outward_code = any($2::text[])
      and ppd_category = 'A'
      and record_status <> 'D'
      and price > 0
      and postcode is not null
      and date_of_transfer >= $3::date
      and date_of_transfer <  ($4::date + interval '1 day')
      and ($5::text is null or property_type = $5)
    group by 1
    order by 1
  `;
  const { rows } = await getMarketMapPool().query<{
    period: string;
    median_price: number;
    transaction_count: number;
  }>(sql, [
    borough.district,
    borough.outwardCodes,
    query.from_date,
    query.to_date,
    typeCode,
  ]);
  return rows.map((r) => ({
    period: r.period,
    median_price: Number(r.median_price),
    transaction_count: r.transaction_count,
  }));
}
