import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { analyzeSpamAndSubject } from "@/lib/ai/spamChecker";

// POST /api/ai/spam-check — real-time spam word detector and subject line scoring
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { subject, bodyText } = body;

    const result = analyzeSpamAndSubject(subject || "", bodyText || "");
    return apiSuccess(result);
  } catch (err) {
    console.error("Spam check error:", err);
    return apiError("Failed to perform spam check", 500);
  }
}
