/**
 * EPC certificate CSV parser (downloaded domestic dataset).
 *
 * The per-year `certificates-YYYY.csv` files are quoted CSV with a wide header
 * (~93 columns) whose order is NOT stable across years — so parsing resolves
 * columns by NAME via a header→index map. We keep only the lean subset the
 * portal needs; everything else is ignored.
 *
 * Sentinels in the source ("", "NO DATA!", "INVALID!", "N/A", "NaN",
 * "unknown") collapse to null. Pure functions — no I/O.
 *
 * Self-contained (no cross-module imports) so the `scripts/ingest-epc.ts`
 * ingest can import it under `node --experimental-strip-types`, which does not
 * resolve the `@/` path alias.
 */

/**
 * Split one CSV line into raw field values, honouring double-quoted fields
 * (commas inside quotes do not split; `""` is an escaped quote). Returns null
 * when quoting is unterminated. Same semantics as ppd-parser's tokenizer.
 */
export function splitCsvFields(line: string): string[] | null {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  if (inQuotes) return null;
  fields.push(current);
  return fields;
}

export type EpcCertificate = {
  certificateNumber: string;
  uprn: string | null;
  postcode: string | null;
  address1: string | null;
  address2: string | null;
  address3: string | null;
  addressFull: string | null;
  /** Leading house number/name of address1 (matcher key). */
  paon: string | null;
  currentEnergyRating: string | null;
  currentEnergyEfficiency: number | null;
  potentialEnergyRating: string | null;
  potentialEnergyEfficiency: number | null;
  propertyType: string | null;
  builtForm: string | null;
  totalFloorArea: number | null;
  constructionAgeBand: string | null;
  tenure: string | null;
  mainFuel: string | null;
  /** Inspection date as "YYYY-MM-DD" (the dedup key — keep latest per property). */
  inspectionDate: string | null;
};

const SENTINELS = new Set([
  "",
  "NO DATA!",
  "INVALID!",
  "N/A",
  "NAN",
  "UNKNOWN",
  "NOT RECORDED",
]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RATING_PATTERN = /^[A-G]$/;

/** Trim and collapse source sentinels to null. */
function clean(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  if (SENTINELS.has(trimmed.toUpperCase())) return null;
  return trimmed;
}

function cleanNumber(value: string | undefined): number | null {
  const c = clean(value);
  if (c === null) return null;
  const n = Number(c);
  return Number.isFinite(n) ? n : null;
}

function cleanRating(value: string | undefined): string | null {
  const c = clean(value);
  if (c === null) return null;
  const upper = c.toUpperCase();
  return RATING_PATTERN.test(upper) ? upper : null;
}

function cleanDate(value: string | undefined): string | null {
  const c = clean(value);
  if (c === null) return null;
  const iso = c.split(" ")[0];
  return ISO_DATE_PATTERN.test(iso) ? iso : null;
}

/** PAON = leading numeric/range token of address1 (e.g. "1", "1A", "12-14"),
 *  else the whole address1 for named dwellings ("Rose Cottage"). */
export function extractPaon(address1: string | null): string | null {
  if (!address1) return null;
  const match = address1.match(/^(\d+[A-Za-z]?(?:\s*-\s*\d+[A-Za-z]?)?)\b/);
  return match ? match[1].replace(/\s+/g, "") : address1;
}

/** Build a header column-name → index map from the CSV header line. */
export function parseEpcHeader(headerLine: string): Map<string, number> {
  const fields = splitCsvFields(headerLine) ?? [];
  const map = new Map<string, number>();
  fields.forEach((name, index) => map.set(name.trim().toLowerCase(), index));
  return map;
}

/**
 * Parse one EPC CSV data line using the header map. Returns null when the line
 * is malformed (bad quoting, wrong column count) or has no certificate number.
 */
export function parseEpcRow(
  line: string,
  header: Map<string, number>,
): EpcCertificate | null {
  const fields = splitCsvFields(line);
  if (!fields || fields.length !== header.size) return null;

  const at = (name: string): string | undefined => {
    const idx = header.get(name);
    return idx === undefined ? undefined : fields[idx];
  };

  const certificateNumber = clean(at("certificate_number"));
  if (!certificateNumber) return null;

  const address1 = clean(at("address1"));

  return {
    certificateNumber,
    uprn: clean(at("uprn")),
    postcode: clean(at("postcode")),
    address1,
    address2: clean(at("address2")),
    address3: clean(at("address3")),
    addressFull: clean(at("address")),
    paon: extractPaon(address1),
    currentEnergyRating: cleanRating(at("current_energy_rating")),
    currentEnergyEfficiency: cleanNumber(at("current_energy_efficiency")),
    potentialEnergyRating: cleanRating(at("potential_energy_rating")),
    potentialEnergyEfficiency: cleanNumber(at("potential_energy_efficiency")),
    propertyType: clean(at("property_type")),
    builtForm: clean(at("built_form")),
    totalFloorArea: cleanNumber(at("total_floor_area")),
    constructionAgeBand: clean(at("construction_age_band")),
    tenure: clean(at("tenure")),
    mainFuel: clean(at("main_fuel")),
    inspectionDate: cleanDate(at("inspection_date")),
  };
}
