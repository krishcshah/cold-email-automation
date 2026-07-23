import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

type Params = { params: { id: string } };

// GET /api/campaigns/[id]/analytics
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
  });
  if (!campaign) return apiError("Campaign not found", 404);

  const [events, totalLeads] = await Promise.all([
    prisma.emailEvent.groupBy({
      by: ["type"],
      where: { campaignId: params.id },
      _count: { type: true },
    }),
    prisma.leadCampaignState.count({ where: { campaignId: params.id } }),
  ]);

  const stats = {
    sent: 0,
    opened: 0,
    clicked: 0,
    replied: 0,
    bounced: 0,
    unsubscribed: 0,
    totalLeads,
  };

  for (const e of events) {
    stats[e.type as keyof typeof stats] = e._count.type;
  }

  const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;
  const clickRate = stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0;

  return apiSuccess({ ...stats, openRate, replyRate, clickRate });
}
