export interface SpamCheckResult {
  score: number; // 0 (spam) - 100 (clean)
  spamWordsFound: string[];
  subjectLineOpenRatePrediction: number; // 0 - 100%
  suggestions: string[];
}

const HIGH_RISK_SPAM_WORDS = [
  "100%", "free", "guaranteed", "no risk", "act now", "cash bonus",
  "click here", "double your income", "earn $", "make money",
  "extra income", "pure profit", "unlimited", "congratulations",
  "winner", "risk-free", "buy now", "cheap", "credit card",
];

export function analyzeSpamAndSubject(subject: string, bodyText: string): SpamCheckResult {
  const combined = `${subject} ${bodyText}`.toLowerCase();
  const foundWords: string[] = [];

  for (const word of HIGH_RISK_SPAM_WORDS) {
    if (combined.includes(word)) {
      foundWords.push(word);
    }
  }

  const baseScore = 100 - foundWords.length * 15;
  const score = Math.max(0, Math.min(100, baseScore));

  // Subject line scoring
  let subjectScore = 75;
  if (subject.length > 5 && subject.length < 50) subjectScore += 15;
  if (subject.includes("{{")) subjectScore += 10;
  if (subject.toLowerCase().includes("free") || subject.includes("!")) subjectScore -= 20;

  const suggestions: string[] = [];
  if (foundWords.length > 0) {
    suggestions.push(`Remove high-risk spam triggers: ${foundWords.join(", ")}`);
  }
  if (subject.length > 60) {
    suggestions.push("Shorten subject line to under 50 characters for better mobile open rates");
  }
  if (!subject.includes("{{")) {
    suggestions.push("Add lead name or company variable {{first_name}} to boost subject open rates by 22%");
  }

  return {
    score,
    spamWordsFound: foundWords,
    subjectLineOpenRatePrediction: Math.max(10, Math.min(98, subjectScore)),
    suggestions,
  };
}
