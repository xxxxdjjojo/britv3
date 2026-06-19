/** UK postcode normalisation. Returns canonical "OUTWARD INWARD" form or null. */

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/;

export function normalisePostcode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.toUpperCase().replace(/\s+/g, "");
  if (cleaned.length < 5 || cleaned.length > 7) return null;
  const inward = cleaned.slice(-3);
  const outward = cleaned.slice(0, -3);
  const candidate = `${outward} ${inward}`;
  return UK_POSTCODE.test(candidate) ? candidate : null;
}

export function outwardCode(raw: string | null | undefined): string | null {
  const normalised = normalisePostcode(raw);
  return normalised ? normalised.split(" ")[0] : null;
}
