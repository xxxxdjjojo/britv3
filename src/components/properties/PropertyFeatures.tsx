/**
 * Property features list -- renders JSONB features as categorized bullet lists.
 * Server component (no "use client" needed).
 */

import { CheckIcon } from "lucide-react";

type PropertyFeaturesProps = Readonly<{
  features: Record<string, unknown>;
}>;

/** Categorize feature keys into groups. */
function categorizeFeatures(
  features: Record<string, unknown>,
): Map<string, string[]> {
  const categories = new Map<string, string[]>();

  const outsideKeywords = ["garden", "patio", "terrace", "balcony", "yard", "outdoor"];
  const parkingKeywords = ["parking", "garage", "driveway", "car"];

  for (const [key, value] of Object.entries(features)) {
    // Skip false/null values
    if (!value) continue;

    const displayName = key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const keyLower = key.toLowerCase();
    let category = "Property Features";

    if (outsideKeywords.some((kw) => keyLower.includes(kw))) {
      category = "Outside";
    } else if (parkingKeywords.some((kw) => keyLower.includes(kw))) {
      category = "Parking";
    }

    const existing = categories.get(category) ?? [];
    // If value is a string, append it; otherwise just use the key name
    const label =
      typeof value === "string" ? `${displayName}: ${value}` : displayName;
    existing.push(label);
    categories.set(category, existing);
  }

  return categories;
}

export function PropertyFeatures({ features }: PropertyFeaturesProps) {
  const categorized = categorizeFeatures(features);

  if (categorized.size === 0) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from(categorized.entries()).map(([category, items]) => (
        <div key={category}>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            {category}
          </h3>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <CheckIcon className="size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
