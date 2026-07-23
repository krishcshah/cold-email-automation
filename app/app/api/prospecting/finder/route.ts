import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { findAndVerifyEmail } from "@/lib/enrichment/emailFinder";

// POST /api/prospecting/finder — find & verify email address by Name + Domain
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { firstName, lastName, domain } = body;

    if (!firstName || !lastName || !domain) {
      return apiError("First name, last name, and company domain are required");
    }

    const result = await findAndVerifyEmail(firstName, lastName, domain);
    return apiSuccess(result);
  } catch (err) {
    console.error("Email finder error:", err);
    return apiError("Failed to find or verify email", 500);
  }
}
