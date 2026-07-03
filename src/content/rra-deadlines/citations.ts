import type { Citation } from "./types";

/**
 * Canonical citation list for the Landlord Deadline Diary.
 *
 * Citation policy (same as src/content/renters-rights/citations.ts):
 * section-level legislation.gov.uk links only where we are confident of the
 * section number; otherwise the act-level landing page plus GOV.UK guidance.
 * Never invent section numbers.
 *
 * The Renters' Rights Act 2025 is chapter 26 — ukpga/2025/26.
 */

export const RRA_2025: Citation = {
  instrument: "Renters' Rights Act 2025",
  section: "Act as enacted (c. 26)",
  url: "https://www.legislation.gov.uk/ukpga/2025/26",
};

export const RRA_2025_CONTENTS: Citation = {
  instrument: "Renters' Rights Act 2025",
  section: "Contents (c. 26)",
  url: "https://www.legislation.gov.uk/ukpga/2025/26/contents",
};

export const RRA_2025_GUIDANCE: Citation = {
  instrument: "GOV.UK guidance",
  section: "Renters' Rights Act 2025 collection",
  url: "https://www.gov.uk/government/collections/renters-rights-act-2025",
};

export const HA_1988_S8: Citation = {
  instrument: "Housing Act 1988",
  section: "Section 8 (grounds for possession, as amended)",
  url: "https://www.legislation.gov.uk/ukpga/1988/50/section/8",
};

export const HA_1988_S13: Citation = {
  instrument: "Housing Act 1988",
  section: "Section 13 (rent increases, as amended)",
  url: "https://www.legislation.gov.uk/ukpga/1988/50/section/13",
};

export const HA_1988_S21: Citation = {
  instrument: "Housing Act 1988",
  section: "Section 21 (abolished for England by the Renters' Rights Act 2025)",
  url: "https://www.legislation.gov.uk/ukpga/1988/50/section/21",
};
