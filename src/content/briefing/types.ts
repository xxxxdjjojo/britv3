/**
 * Independent Agent Briefing — content model.
 *
 * Editorial red line: the Rightmove CAT collective claim is ALLEGED, not
 * proven. Every edition that discusses the case must use "the claim alleges"
 * language and cite sources (enforced by src/__tests__/briefing tests).
 */
export type BriefingEdition = {
  slug: string;
  edition: number;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  summary: string;
  body: ReadonlyArray<{
    heading: string;
    paragraphs: ReadonlyArray<string>;
    sources?: ReadonlyArray<{ label: string; url: string }>;
  }>;
};
