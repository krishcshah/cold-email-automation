import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { generateIcebreaker } from "@/lib/ai/writer";

// POST /api/ai/icebreaker — generate personalized first line per lead
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { lead } = body;
    if (!lead) return apiError("Lead data is required");

    const icebreaker = generateIcebreaker(lead);
    return apiSuccess({ icebreaker });
  } catch (err) {
    console.error("AI icebreaker error:", err);
    return apiError("Failed to generate icebreaker", 500);
  }
}
