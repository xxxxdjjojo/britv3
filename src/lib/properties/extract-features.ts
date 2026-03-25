const MAX_LENGTH = 100;
const MAX_ITEMS = 20;
const sanitize = (s: string) => s.replace(/[<>]/g, "").trim().slice(0, MAX_LENGTH);

export function extractFeatureItems(features: Record<string, unknown>): string[] {
  const items = features["items"];
  if (Array.isArray(items)) {
    return items
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map(sanitize)
      .slice(0, MAX_ITEMS);
  }
  return Object.entries(features)
    .filter(([, v]) => typeof v === "string" || v === true)
    .map(([k]) => sanitize(k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())))
    .slice(0, 10);
}
