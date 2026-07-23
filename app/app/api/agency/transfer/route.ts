import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// POST /api/agency/transfer — transfer campaigns or lead lists between workspaces
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { campaignId, leadListId, targetUserId } = body;

    if (!targetUserId) return apiError("Target User ID is required");

    if (campaignId) {
      await prisma.campaign.update({
        where: { id: campaignId, userId },
        data: { userId: targetUserId },
      });
    }

    if (leadListId) {
      await prisma.leadList.update({
        where: { id: leadListId, userId },
        data: { userId: targetUserId },
      });
    }

    return apiSuccess({ transferred: true });
  } catch (err) {
    console.error("Transfer error:", err);
    return apiError("Failed to transfer asset to target workspace", 500);
  }
}
