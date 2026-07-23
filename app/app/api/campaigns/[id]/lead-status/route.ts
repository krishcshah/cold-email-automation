import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

type Params = { params: { id: string } };

// GET /api/campaigns/[id]/lead-status?page=1&limit=50
export async function GET(req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
  });
  if (!campaign) return apiError("Campaign not found", 404);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Number(url.searchParams.get("limit") ?? "50"));
  const skip = (page - 1) * limit;

  const [states, total] = await Promise.all([
    prisma.leadCampaignState.findMany({
      where: { campaignId: params.id },
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        lead: {
          select: { email: true, firstName: true, lastName: true, company: true },
        },
      },
    }),
    prisma.leadCampaignState.count({ where: { campaignId: params.id } }),
  ]);

  return apiSuccess({ states, total, page, limit });
}
