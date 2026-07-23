import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { convertToSpintax } from "@/lib/ai/writer";

// POST /api/ai/spintax — convert text to spintax
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { text } = body;
    if (!text) return apiError("Text is required");

    const spintax = convertToSpintax(text);
    return apiSuccess({ spintax });
  } catch (err) {
    console.error("AI spintax error:", err);
    return apiError("Failed to convert to spintax", 500);
  }
}
