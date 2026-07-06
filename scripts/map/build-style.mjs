/**
 * build-style.mjs
 * Reads scripts/map/liberty-base.json, applies TrueDeed palette + layer edits,
 * validates with @maplibre/maplibre-gl-style-spec, writes public/map/truedeed-style.json.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

// ---------------------------------------------------------------------------
// Load source
// ---------------------------------------------------------------------------
const basePath = join(__dirname, "liberty-base.json");
const base = JSON.parse(readFileSync(basePath, "utf8"));

// ---------------------------------------------------------------------------
// Discover vector source key dynamically
// ---------------------------------------------------------------------------
const vectorSourceKey = Object.entries(base.sources).find(
  ([, v]) => v.type === "vector" && v.url?.includes("openfreemap.org/planet")
)?.[0];

if (!vectorSourceKey) {
  console.error("Could not find vector source pointing to openfreemap.org/planet");
  process.exit(1);
}

console.log(`Vector source key: ${vectorSourceKey}`);

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const P = {
  land: "#f1ead9",
  builtUp: "#ece7da",
  field: "#e8dab6",
  grass: "#d8e4c0",
  wood: "#5d8a5d",
  water: "#9cc0da",
  road: "#ffffff",
  casing: "#ddd4bf",
  building: "#d9e5e2",
};

// ---------------------------------------------------------------------------
// Layer edit helpers
// ---------------------------------------------------------------------------

/** Safely set a nested paint or layout property, cloning the layer. */
function setLayerProp(layer, group, key, value) {
  return {
    ...layer,
    [group]: {
      ...(layer[group] || {}),
      [key]: value,
    },
  };
}

function setVisibility(layer, visibility) {
  return setLayerProp(layer, "layout", "visibility", visibility);
}

function setFillColor(layer, color) {
  return setLayerProp(layer, "paint", "fill-color", color);
}

function deleteFillOutlineColor(layer) {
  if (!layer.paint || !("fill-outline-color" in layer.paint)) return layer;
  const { "fill-outline-color": _removed, ...restPaint } = layer.paint;
  return { ...layer, paint: restPaint };
}

function setLineColor(layer, color) {
  return setLayerProp(layer, "paint", "line-color", color);
}

// ---------------------------------------------------------------------------
// Edit each layer
// ---------------------------------------------------------------------------
const KEEP_SYMBOL_SOURCES = new Set(["place", "transportation_name", "water_name"]);

function editLayer(layer) {
  const sl = layer["source-layer"];
  const id = layer.id ?? "";
  const type = layer.type;

  // A. background
  if (type === "background") {
    return setLayerProp(layer, "paint", "background-color", P.land);
  }

  // B. Hide ALL existing building layers (both fill and fill-extrusion)
  if (sl === "building") {
    return setVisibility(layer, "none");
  }

  // C. Fill layers
  if (type === "fill") {
    let edited = layer;

    if (sl === "water") {
      edited = setFillColor(edited, P.water);
    } else if (sl === "park") {
      edited = setFillColor(edited, P.grass);
    } else if (/wood|forest|tree/i.test(id)) {
      edited = setFillColor(edited, P.wood);
    } else if (/grass|meadow|park/i.test(id)) {
      edited = setFillColor(edited, P.grass);
    } else if (/farm|sand|scrub/i.test(id)) {
      edited = setFillColor(edited, P.field);
    } else if (sl === "landuse") {
      if (/wood|forest/i.test(id)) {
        edited = setFillColor(edited, P.wood);
      } else {
        edited = setFillColor(edited, P.builtUp);
      }
    }

    edited = deleteFillOutlineColor(edited);
    return edited;
  }

  // D. Line layers
  if (type === "line") {
    if (sl === "boundary") {
      return setVisibility(layer, "none");
    }
    if (sl === "waterway") {
      return setLineColor(layer, P.water);
    }
    if (/casing/i.test(id)) {
      return setLineColor(layer, P.casing);
    }
    return setLineColor(layer, P.road);
  }

  // E. Symbol layers — keep only allowed source-layers
  if (type === "symbol") {
    if (!KEEP_SYMBOL_SOURCES.has(sl)) {
      return setVisibility(layer, "none");
    }
    return layer;
  }

  return layer;
}

// Apply edits to all layers
const editedLayers = base.layers.map(editLayer);

// ---------------------------------------------------------------------------
// F. Insert td-buildings-3d immediately before the first visible symbol layer
// ---------------------------------------------------------------------------
const td3dLayer = {
  id: "td-buildings-3d",
  type: "fill-extrusion",
  source: vectorSourceKey,
  "source-layer": "building",
  minzoom: 13,
  paint: {
    "fill-extrusion-color": P.building,
    "fill-extrusion-height": [
      "coalesce",
      ["get", "render_height"],
      ["+", 4, ["%", ["to-number", ["coalesce", ["id"], 7], 7], 5]],
    ],
    "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
    "fill-extrusion-opacity": 0.95,
    "fill-extrusion-vertical-gradient": true,
  },
};

const firstVisibleSymIdx = editedLayers.findIndex(
  (l) =>
    l.type === "symbol" &&
    (!l.layout?.visibility || l.layout.visibility !== "none")
);

if (firstVisibleSymIdx === -1) {
  console.error("No visible symbol layer found — cannot insert td-buildings-3d");
  process.exit(1);
}

const finalLayers = [
  ...editedLayers.slice(0, firstVisibleSymIdx),
  td3dLayer,
  ...editedLayers.slice(firstVisibleSymIdx),
];

// ---------------------------------------------------------------------------
// Assemble final style
// ---------------------------------------------------------------------------
const finalStyle = {
  ...base,
  layers: finalLayers,
};

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------
const errors = validateStyleMin(finalStyle);
if (errors.length > 0) {
  console.error("Style validation errors:");
  for (const err of errors) {
    console.error(" -", err.message);
  }
  process.exit(1);
}

console.log("Validation: 0 errors");

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const outPath = join(ROOT, "public/map/truedeed-style.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(finalStyle, null, 2), "utf8");
console.log(`Written: ${outPath}`);
