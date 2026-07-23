export interface SpamCheckResult {
  score: number; // 0 to 10 (0 = clean, 10 = high spam likelihood)
  rating: "Good" | "Moderate" | "High Risk";
  triggers: { word: string; category: string; severity: "low" | "medium" | "high" }[];
  suggestions: string[];
}

const SPAM_TRIGGER_WORDS: { word: string; category: string; severity: "low" | "medium" | "high" }[] = [
  // Financial & Urgency
  { word: "100% free", category: "Financial", severity: "high" },
  { word: "free money", category: "Financial", severity: "high" },
  { word: "earn $", category: "Financial", severity: "high" },
  { word: "make $", category: "Financial", severity: "high" },
  { word: "guaranteed", category: "Financial", severity: "medium" },
  { word: "no credit card required", category: "Financial", severity: "medium" },
  { word: "risk free", category: "Financial", severity: "medium" },
  { word: "risk-free", category: "Financial", severity: "medium" },
  { word: "act now", category: "Urgency", severity: "high" },
  { word: "urgent", category: "Urgency", severity: "high" },
  { word: "apply now", category: "Urgency", severity: "medium" },
  { word: "limited time", category: "Urgency", severity: "medium" },

  // Marketing & Hype
  { word: "click here", category: "Marketing", severity: "high" },
  { word: "click below", category: "Marketing", severity: "high" },
  { word: "buy now", category: "Marketing", severity: "high" },
  { word: "order now", category: "Marketing", severity: "high" },
  { word: "winner", category: "Hype", severity: "high" },
  { word: "congratulations", category: "Hype", severity: "medium" },
  { word: "special promotion", category: "Marketing", severity: "medium" },
  { word: "incredible deal", category: "Marketing", severity: "medium" },
  { word: "as seen on", category: "Hype", severity: "medium" },

  // Deceptive
  { word: "dear friend", category: "Deceptive", severity: "high" },
  { word: "this is not spam", category: "Deceptive", severity: "high" },
  { word: "no catch", category: "Deceptive", severity: "high" },
  { word: "100% satisfied", category: "Deceptive", severity: "medium" },
  { word: "no hidden cost", category: "Deceptive", severity: "medium" },
];

export function checkSpamScore(subject: string, bodyText: string): SpamCheckResult {
  const fullContent = `${subject} ${bodyText}`.toLowerCase();
  const foundTriggers: { word: string; category: string; severity: "low" | "medium" | "high" }[] = [];
  const suggestions: string[] = [];

  let rawScore = 0;

  // 1. Check trigger words
  for (const trigger of SPAM_TRIGGER_WORDS) {
    if (fullContent.includes(trigger.word.toLowerCase())) {
      foundTriggers.push(trigger);
      rawScore += trigger.severity === "high" ? 2.5 : trigger.severity === "medium" ? 1.5 : 0.8;
    }
  }

  // 2. Check ALL CAPS ratio in subject
  const upperCount = (subject.match(/[A-Z]/g) || []).length;
  const letterCount = (subject.match(/[a-zA-Z]/g) || []).length;
  if (letterCount > 5 && upperCount / letterCount > 0.5) {
    rawScore += 2;
    suggestions.push("Avoid using ALL CAPS in the subject line.");
  }

  // 3. Check for multiple exclamation or question marks (e.g. !!! or ???)
  if (/[!]{2,}/.test(subject) || /[?]{2,}/.test(subject)) {
    rawScore += 1.5;
    suggestions.push("Avoid excessive punctuation (like !!! or ???) in the subject.");
  }

  // 4. Check for dollar signs in subject
  if (/\$\d+/.test(subject)) {
    rawScore += 1.5;
    suggestions.push("Avoid dollar amounts ($) in subject lines.");
  }

  // 5. Short subject check
  if (subject.trim().length === 0) {
    rawScore += 2;
    suggestions.push("Add a clear, concise subject line.");
  }

  // Cap score between 0 and 10
  const finalScore = Math.min(10, Math.max(0, Math.round(rawScore * 10) / 10));

  let rating: "Good" | "Moderate" | "High Risk" = "Good";
  if (finalScore >= 6) rating = "High Risk";
  else if (finalScore >= 3) rating = "Moderate";

  if (foundTriggers.length > 0) {
    suggestions.push(
      `Consider replacing spam trigger words: ${foundTriggers.map((t) => `"${t.word}"`).join(", ")}.`
    );
  }

  if (suggestions.length === 0 && finalScore < 3) {
    suggestions.push("Content looks great! Low spam likelihood.");
  }

  return {
    score: finalScore,
    rating,
    triggers: foundTriggers,
    suggestions,
  };
}
