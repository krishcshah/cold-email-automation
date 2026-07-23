import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { calculatePredictiveLeadScore } from "@/lib/ai/leadScorer";

// POST /api/ai/score-lead — calculate conversion probability score
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { title, companySize, email } = body;

    const domain = email ? email.split("@")[1] : undefined;
    const result = calculatePredictiveLeadScore(title, companySize, domain);

    return apiSuccess(result);
  } catch (err) {
    console.error("Lead scoring error:", err);
    return apiError("Failed to calculate lead score", 500);
  }
}
