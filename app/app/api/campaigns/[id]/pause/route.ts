import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

type Params = { params: { id: string } };

// POST /api/campaigns/[id]/pause
export async function POST(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
  });
  if (!campaign) return apiError("Campaign not found", 404);
  if (campaign.status !== "active") return apiError("Campaign is not active");

  await prisma.campaign.update({
    where: { id: params.id },
    data: { status: "paused" },
  });

  return apiSuccess({ paused: true });
}
