/**
 * Fetch and vendor postcode-district boundary polygons for the market-map MVP.
 *
 * Source: https://github.com/missinglink/uk-postcode-polygons (postcode-district
 * polygons derived from Open Postcode Geo / OS Open Data, Open Government
 * Licence v3). We download the relevant postcode-area file, keep only the
 * outward codes we render, strip styling cruft, and write a small committed
 * GeoJSON. For the MVP this is Wandsworth's postcode districts.
 *
 * Usage:
 *   node scripts/fetch-postcode-districts.mjs
 *
 * The output is committed so the app never depends on this source at runtime.
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Postcode districts that contain Wandsworth (LB Wandsworth) transactions.
const WANDSWORTH_DISTRICTS = [
  "SW4",
  "SW8",
  "SW11",
  "SW12",
  "SW15",
  "SW16",
  "SW17",
  "SW18",
  "SW19",
];

const SOURCE_URL =
  "https://raw.githubusercontent.com/missinglink/uk-postcode-polygons/master/geojson/SW.geojson";

const OUTPUT = join(
  __dirname,
  "..",
  "src",
  "data",
  "geo",
  "wandsworth-postcode-districts.json",
);

async function main() {
  console.log(`Downloading ${SOURCE_URL} ...`);
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Download failed: HTTP ${res.status}`);
  }
  const collection = await res.json();

  const wanted = new Set(WANDSWORTH_DISTRICTS);
  const features = collection.features
    .filter((f) => wanted.has(f.properties?.name))
    .map((f) => ({
      type: "Feature",
      properties: { area_id: f.properties.name, area_name: f.properties.name },
      geometry: f.geometry,
    }))
    .sort((a, b) => a.properties.area_id.localeCompare(b.properties.area_id));

  const missing = WANDSWORTH_DISTRICTS.filter(
    (d) => !features.some((f) => f.properties.area_id === d),
  );
  if (missing.length > 0) {
    console.warn(`Warning: no polygon found for: ${missing.join(", ")}`);
  }

  const out = {
    type: "FeatureCollection",
    metadata: {
      source:
        "missinglink/uk-postcode-polygons (Open Postcode Geo / OS Open Data, OGL v3)",
      generated_by: "scripts/fetch-postcode-districts.mjs",
    },
    features,
  };

  writeFileSync(OUTPUT, JSON.stringify(out));
  console.log(`Wrote ${features.length} districts to ${OUTPUT}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
