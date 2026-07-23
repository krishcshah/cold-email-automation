export interface SpamCheckResult {
  score: number;
  rating: "excellent" | "good" | "fair" | "poor";
  foundWords: string[];
  triggers: string[];
  suggestions: string[];
}

const HIGH_RISK_SPAM_WORDS = [
  "free", "guaranteed", "100%", "act now", "no risk", "winner",
  "cash", "earn money", "risk free", "buy now", "click here"
];

export function checkSpamScore(subject: string, body: string): SpamCheckResult {
  const text = `${subject} ${body}`.toLowerCase();
  const foundWords = HIGH_RISK_SPAM_WORDS.filter((w) => text.includes(w));
  const score = Math.max(0, 100 - foundWords.length * 15);

  let rating: "excellent" | "good" | "fair" | "poor" = "excellent";
  if (score < 60) rating = "poor";
  else if (score < 80) rating = "fair";
  else if (score < 95) rating = "good";

  return {
    score,
    rating,
    foundWords,
    triggers: foundWords,
    suggestions: foundWords.map((w) => `Remove or rephrase high-risk word: "${w}"`),
  };
}
