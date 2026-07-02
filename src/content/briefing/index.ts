import { editionOneCatCertificationHearing } from "./edition-1-cat-certification-hearing";
import type { BriefingEdition } from "./types";

export type { BriefingEdition } from "./types";

/** All published briefing editions, sorted newest first. */
export const BRIEFING_EDITIONS: ReadonlyArray<BriefingEdition> = [
  editionOneCatCertificationHearing,
].sort((a, b) => b.date.localeCompare(a.date));

export function getBriefingEdition(slug: string): BriefingEdition | undefined {
  return BRIEFING_EDITIONS.find((edition) => edition.slug === slug);
}
