/**
 * Truedeed PPD monthly-update CSV parser (spec §4.1).
 *
 * HM Land Registry Price Paid Data monthly-update files are quoted CSV with
 * NO header row and a fixed 16-column order:
 *
 *   1 transaction unique id (braced GUID — braces stripped to `tuid`)
 *   2 price (integral pounds → `pricePence` = pounds × 100)
 *   3 transfer date ("YYYY-MM-DD 00:00" → "YYYY-MM-DD")
 *   4 postcode            5 property type (D/S/T/F/O)
 *   6 new-build flag (Y/N → boolean)
 *   7 tenure (F/L)        8 PAON   9 SAON   10 street
 *   11 locality  12 town  13 district  14 county
 *   15 PPD category (A standard / B additional)
 *   16 record status (A=addition, C=change, D=delete — PPD is revisable)
 *
 * Pure functions — no I/O. The `ppd:ingest` job (spec §4.2) streams file
 * text through `iteratePpdCsv` and upserts by TUID honouring A/C/D.
 */

/** Record status per spec §4.1: addition / change / delete. */
export type PpdRecordStatus = "A" | "C" | "D";

/** PPD category per spec §4.1: A standard, B additional (repossessions etc.). */
export type PpdCategory = "A" | "B";

/** Property type per spec §4.1: detached/semi/terraced/flat/other. */
export type PpdPropertyType = "D" | "S" | "T" | "F" | "O";

/** One parsed PPD monthly-update row. Empty optional address fields → null. */
export type ParsedPpdRow = {
  /** Transaction unique id with the surrounding braces stripped. */
  tuid: string;
  /** Sale price in pence (PPD prices are integral pounds). */
  pricePence: number;
  /** Transfer date as "YYYY-MM-DD" (PPD's " 00:00" time suffix discarded). */
  transferDate: string;
  postcode: string | null;
  propertyType: PpdPropertyType;
  newBuild: boolean;
  /** Tenure as supplied (F/L per spec; passed through unvalidated). */
  tenure: string;
  paon: string | null;
  saon: string | null;
  street: string | null;
  locality: string | null;
  town: string | null;
  district: string | null;
  county: string | null;
  ppdCategory: PpdCategory;
  recordStatus: PpdRecordStatus;
};

const COLUMN_COUNT = 16;
const PENCE_PER_POUND = 100;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const PROPERTY_TYPES: readonly PpdPropertyType[] = ["D", "S", "T", "F", "O"];
const CATEGORIES: readonly PpdCategory[] = ["A", "B"];
const RECORD_STATUSES: readonly PpdRecordStatus[] = ["A", "C", "D"];

/** Empty string → null (PPD leaves optional address fields blank). */
const emptyToNull = (value: string): string | null =>
  value === "" ? null : value;

/**
 * Split one CSV line into raw field values, honouring double-quoted fields
 * (commas inside quotes do not split; `""` is an escaped quote).
 * Returns null when quoting is unterminated.
 */
const splitCsvFields = (line: string): string[] | null => {
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
};

/**
 * Parse a single PPD monthly-update CSV line (spec §4.1 column order).
 *
 * Returns null for malformed lines: wrong column count, unterminated
 * quoting, non-integral price, unparseable date, or out-of-domain
 * property type / category / record status.
 */
export function parsePpdCsvLine(line: string): ParsedPpdRow | null {
  const fields = splitCsvFields(line);
  if (!fields || fields.length !== COLUMN_COUNT) return null;

  const [
    rawTuid,
    rawPrice,
    rawDate,
    rawPostcode,
    rawPropertyType,
    rawNewBuild,
    rawTenure,
    rawPaon,
    rawSaon,
    rawStreet,
    rawLocality,
    rawTown,
    rawDistrict,
    rawCounty,
    rawCategory,
    rawStatus,
  ] = fields;

  const tuid = rawTuid.replace(/[{}]/g, "").trim();
  if (tuid === "") return null;

  const pounds = Number(rawPrice);
  if (!Number.isInteger(pounds)) return null;

  const transferDate = rawDate.split(" ")[0];
  if (!ISO_DATE_PATTERN.test(transferDate)) return null;

  const propertyType = rawPropertyType as PpdPropertyType;
  if (!PROPERTY_TYPES.includes(propertyType)) return null;

  if (rawNewBuild !== "Y" && rawNewBuild !== "N") return null;

  const ppdCategory = rawCategory as PpdCategory;
  if (!CATEGORIES.includes(ppdCategory)) return null;

  const recordStatus = rawStatus as PpdRecordStatus;
  if (!RECORD_STATUSES.includes(recordStatus)) return null;

  return {
    tuid,
    pricePence: pounds * PENCE_PER_POUND,
    transferDate,
    postcode: emptyToNull(rawPostcode),
    propertyType,
    newBuild: rawNewBuild === "Y",
    tenure: rawTenure,
    paon: emptyToNull(rawPaon),
    saon: emptyToNull(rawSaon),
    street: emptyToNull(rawStreet),
    locality: emptyToNull(rawLocality),
    town: emptyToNull(rawTown),
    district: emptyToNull(rawDistrict),
    county: emptyToNull(rawCounty),
    ppdCategory,
    recordStatus,
  };
}

/**
 * Iterate parsed rows over multi-line PPD CSV text, in file order.
 *
 * Handles LF and CRLF line endings, skips blank lines (including trailing
 * blank lines), and silently skips malformed lines — callers that need
 * malformed-line accounting should use {@link parsePpdCsvLine} directly.
 */
export function* iteratePpdCsv(
  text: string,
): Generator<ParsedPpdRow, void, undefined> {
  for (const rawLine of text.split("\n")) {
    const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
    if (line.trim() === "") continue;
    const row = parsePpdCsvLine(line);
    if (row) yield row;
  }
}
