import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { checkSpamScore } from "@/lib/deliverability/spamChecker";

// POST /api/deliverability/spam-score
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { subject = "", body: emailBody = "" } = body;

    const result = checkSpamScore(subject, emailBody);
    return apiSuccess(result);
  } catch (err) {
    console.error("Spam score API error:", err);
    return apiError("Failed to check spam score", 500);
  }
}
