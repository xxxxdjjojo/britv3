export type SpamIndicators = Readonly<{
  has_contact_info: boolean;
  has_links: boolean;
  has_excessive_caps: boolean;
  has_promotional: boolean;
  has_repeated_chars: boolean;
  has_excessive_punctuation: boolean;
  spam_score: number;
}>;

// UK phone number patterns (mobile and landline)
const PHONE_REGEX = /(?:\+44|0)\s*\d[\d\s]{8,12}\d/;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/i;
const REPEATED_CHARS_REGEX = /(.)\1{3,}/;
const EXCESSIVE_PUNCTUATION_REGEX = /[!?.]{6,}/;

const PROMOTIONAL_KEYWORDS = [
  "discount", "free", "click here", "call now", "act now",
  "limited offer", "buy now", "special offer", "guaranteed",
  "no obligation", "risk free", "winner", "congratulations",
  "earn money", "make money",
];

function hasExcessiveCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 10) return false; // Too short to judge
  const upperCount = (text.match(/[A-Z]/g) || []).length;
  return upperCount / letters.length > 0.5;
}

function hasPromotionalLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return PROMOTIONAL_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * Detect spam indicators in review text.
 * Returns individual flags and a total spam_score (0-6).
 */
export function detectSpam(text: string): SpamIndicators {
  const has_contact_info = PHONE_REGEX.test(text) || EMAIL_REGEX.test(text);
  const has_links = URL_REGEX.test(text);
  const has_excessive_caps = hasExcessiveCaps(text);
  const has_promotional = hasPromotionalLanguage(text);
  const has_repeated_chars = REPEATED_CHARS_REGEX.test(text);
  const has_excessive_punctuation = EXCESSIVE_PUNCTUATION_REGEX.test(text);

  const spam_score =
    (has_contact_info ? 1 : 0) +
    (has_links ? 1 : 0) +
    (has_excessive_caps ? 1 : 0) +
    (has_promotional ? 1 : 0) +
    (has_repeated_chars ? 1 : 0) +
    (has_excessive_punctuation ? 1 : 0);

  return {
    has_contact_info,
    has_links,
    has_excessive_caps,
    has_promotional,
    has_repeated_chars,
    has_excessive_punctuation,
    spam_score,
  };
}
