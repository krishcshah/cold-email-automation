import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { generateEmailBody } from "@/lib/ai/writer";

// POST /api/ai/generate-body
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { goal, persona, tone } = body;

    const emailBody = await generateEmailBody(goal, persona, tone);
    return apiSuccess({ body: emailBody });
  } catch (err) {
    console.error("AI body generator error:", err);
    return apiError("Failed to generate email body", 500);
  }
}
