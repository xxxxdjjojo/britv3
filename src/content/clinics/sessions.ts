/**
 * Landlord Transition Clinics — content model.
 *
 * Clinic sessions are founder-orchestrated webinars: scheduled live Q&A
 * sessions for landlords navigating the Renters' Rights Act 2025.
 *
 * UPCOMING_SESSION: set to a ClinicSession when a session is scheduled;
 * leave undefined when none is currently announced.
 * PAST_SESSIONS: grows as sessions are held and recordings are available.
 *
 * Content is updated manually by the founder; no DB or CMS involved.
 */

export type ClinicSession = {
  id: string;
  /** ISO date (YYYY-MM-DD). Optional — set once confirmed. */
  date?: string;
  title: string;
  description: string;
  /** URL to the recorded webinar (YouTube, Vimeo, etc.). Optional. */
  recordingUrl?: string;
  /** Short excerpt from the session transcript. Optional. */
  transcriptExcerpt?: string;
  faqs: ReadonlyArray<{ q: string; a: string }>;
};

/** Bump this when content is materially updated. */
export const CLINICS_CONTENT_VERSION = 1;

/**
 * The next scheduled clinic session.
 * Set to undefined when no session is currently announced.
 */
export const UPCOMING_SESSION: ClinicSession | undefined = undefined;

/**
 * Past clinic sessions, newest first.
 * Empty until the first session has been held.
 */
export const PAST_SESSIONS: ReadonlyArray<ClinicSession> = [];
