import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { generateSubjectVariants } from "@/lib/ai/writer";

// POST /api/ai/generate-subjects
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { goal, persona } = body;

    const subjects = await generateSubjectVariants(goal, persona);
    return apiSuccess({ subjects });
  } catch (err) {
    console.error("AI subject generator error:", err);
    return apiError("Failed to generate subject lines", 500);
  }
}
