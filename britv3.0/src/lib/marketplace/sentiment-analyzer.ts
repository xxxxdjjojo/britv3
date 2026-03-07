export type SentimentScore =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

const POSITIVE_WORDS = new Set([
  "excellent", "amazing", "wonderful", "fantastic", "superb",
  "outstanding", "brilliant", "great", "good", "professional",
  "friendly", "helpful", "reliable", "efficient", "thorough",
  "prompt", "courteous", "skilled", "impressed", "recommend",
  "perfect", "exceptional", "delighted", "satisfied", "pleased",
  "clean", "tidy", "polite", "trustworthy", "knowledgeable",
]);

const NEGATIVE_WORDS = new Set([
  "terrible", "awful", "horrible", "dreadful", "appalling",
  "disgusting", "poor", "bad", "unprofessional", "rude",
  "unreliable", "incompetent", "careless", "lazy", "dishonest",
  "late", "messy", "overpriced", "disappointed", "avoid",
  "worst", "useless", "shoddy", "nightmare", "disaster",
  "broken", "damaged", "dirty", "slow", "unresponsive",
]);

const INTENSIFIERS = new Set([
  "very", "extremely", "incredibly", "absolutely", "really",
  "highly", "totally", "completely", "utterly", "exceptionally",
]);

/**
 * Analyze sentiment of review text using keyword-based scoring.
 * Returns a sentiment label and confidence score.
 */
export function analyzeReviewSentiment(text: string): {
  sentiment: SentimentScore;
  confidence: number;
} {
  if (!text.trim()) {
    return { sentiment: "neutral", confidence: 0 };
  }

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  let matchedWords = 0;
  let nextMultiplier = 1;

  for (const word of words) {
    const cleaned = word.replace(/[^a-z]/g, "");

    if (INTENSIFIERS.has(cleaned)) {
      nextMultiplier = 1.5;
      continue;
    }

    if (POSITIVE_WORDS.has(cleaned)) {
      score += 1 * nextMultiplier;
      matchedWords++;
      nextMultiplier = 1;
    } else if (NEGATIVE_WORDS.has(cleaned)) {
      score -= 1 * nextMultiplier;
      matchedWords++;
      nextMultiplier = 1;
    } else {
      nextMultiplier = 1;
    }
  }

  const confidence = Math.min(matchedWords / 5, 1);

  let sentiment: SentimentScore;
  if (score >= 3) {
    sentiment = "very_positive";
  } else if (score >= 1) {
    sentiment = "positive";
  } else if (score <= -3) {
    sentiment = "very_negative";
  } else if (score <= -1) {
    sentiment = "negative";
  } else {
    sentiment = "neutral";
  }

  return { sentiment, confidence };
}
