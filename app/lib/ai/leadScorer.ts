export interface LeadScoreResult {
  score: number; // 0 - 100%
  tier: "hot" | "medium" | "cold";
  reasons: string[];
}

export function calculatePredictiveLeadScore(
  title?: string,
  companySize?: string,
  emailDomain?: string
): LeadScoreResult {
  let score = 50;
  const reasons: string[] = [];

  const cleanTitle = (title || "").toLowerCase();
  if (cleanTitle.includes("vp") || cleanTitle.includes("director") || cleanTitle.includes("head") || cleanTitle.includes("chief") || cleanTitle.includes("founder")) {
    score += 25;
    reasons.push("Executive Decision Maker Title");
  }

  if (companySize === "51-200 employees" || companySize === "201-500 employees") {
    score += 15;
    reasons.push("Ideal Target Company Size");
  }

  if (emailDomain && !emailDomain.includes("gmail") && !emailDomain.includes("yahoo")) {
    score += 10;
    reasons.push("Verified Custom B2B Domain");
  }

  const finalScore = Math.min(99, Math.max(10, score));
  const tier = finalScore >= 80 ? "hot" : finalScore >= 50 ? "medium" : "cold";

  return {
    score: finalScore,
    tier,
    reasons,
  };
}
