import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { checkBlacklists } from "@/lib/deliverability/blacklistChecker";

// POST /api/deliverability/blacklist-check
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { domain } = body;
    if (!domain) return apiError("Domain or IP is required");

    const result = await checkBlacklists(domain);
    return apiSuccess(result);
  } catch (err) {
    console.error("Blacklist check API error:", err);
    return apiError("Failed to check domain blacklists", 500);
  }
}
