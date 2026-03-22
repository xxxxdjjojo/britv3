/**
 * UK-specific validation utilities for professional registration.
 * All validators are pure functions — no side effects, no API calls.
 */

/** Validate Companies House number — 8-char alphanumeric (SC, NI, OC prefixes allowed) */
export function validateCompaniesHouseNumber(value: string): boolean {
  if (!value) return false;
  const normalized = value.toUpperCase().replace(/\s/g, "");
  return /^[A-Z0-9]{8}$/.test(normalized);
}

/** Normalize Companies House number to uppercase */
export function normalizeCompaniesHouseNumber(value: string): string {
  return value.toUpperCase().replace(/\s/g, "");
}

/** Validate HMRC Unique Taxpayer Reference — exactly 10 digits */
export function validateUTR(value: string): boolean {
  if (!value) return false;
  const normalized = value.replace(/\s/g, "");
  return /^\d{10}$/.test(normalized);
}

/** Normalize UTR by stripping spaces */
export function normalizeUTR(value: string): string {
  return value.replace(/\s/g, "");
}

/** Validate UK phone number — +44 or 07/01/02 format */
export function validateUKPhone(value: string): boolean {
  if (!value) return false;
  const normalized = value.replace(/[\s\-\(\)]/g, "");
  return /^(\+44\d{10}|0\d{10})$/.test(normalized);
}

/** Normalize UK phone to +44 format */
export function normalizeUKPhone(value: string): string {
  const normalized = value.replace(/[\s\-\(\)]/g, "");
  if (normalized.startsWith("0")) {
    return "+44" + normalized.slice(1);
  }
  return normalized;
}

/** Validate UK postcode district (e.g. SW1, M14, EC1A, B1) */
export function validatePostcodeDistrict(value: string): boolean {
  if (!value) return false;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{1,2}\d{1,2}[A-Z]?$/.test(normalized);
}

/** Normalize and extract postcode district from input (handles full postcodes) */
export function normalizePostcodeDistrict(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (trimmed.includes(" ")) {
    return trimmed.split(" ")[0];
  }
  if (trimmed.length > 4 && /^[A-Z]{1,2}\d/.test(trimmed)) {
    const match = trimmed.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
    return match ? match[1] : trimmed;
  }
  return trimmed;
}

/** Validate UK VAT number — GB prefix optional, 9 digits */
export function validateVATNumber(value: string): boolean {
  if (!value) return false;
  const normalized = value.replace(/\s/g, "").toUpperCase();
  return /^(GB)?\d{9}$/.test(normalized);
}

/** Validate HMRC AML reference number format */
export function validateHmrcAmlReference(value: string): boolean {
  if (!value) return false;
  const normalized = value.replace(/\s/g, "");
  return /^[A-Z0-9]{6,20}$/i.test(normalized);
}
