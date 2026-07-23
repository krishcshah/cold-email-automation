import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess } from "@/lib/api";

// GET /api/dashboard
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const userCampaigns = await prisma.campaign.findMany({
    where: { userId },
    select: { id: true },
  });
  const campaignIds = userCampaigns.map((c) => c.id);

  const [
    totalLeads,
    totalCampaigns,
    activeCampaigns,
    eventStats,
    recentCampaigns,
  ] = await Promise.all([
    prisma.lead.count({
      where: {
        leadList: { userId },
      },
    }),
    prisma.campaign.count({ where: { userId } }),
    prisma.campaign.count({ where: { userId, status: "active" } }),
    prisma.emailEvent.groupBy({
      by: ["type"],
      where: { campaignId: { in: campaignIds } },
      _count: { type: true },
    }),
    prisma.campaign.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        _count: { select: { sequenceSteps: true } },
      },
    }),
  ]);

  const stats = { sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, unsubscribed: 0 };
  for (const e of eventStats) {
    stats[e.type as keyof typeof stats] = e._count.type;
  }

  const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;
  const bounceRate = stats.sent > 0 ? Math.round((stats.bounced / stats.sent) * 100) : 0;

  return apiSuccess({
    totalLeads,
    totalCampaigns,
    activeCampaigns,
    emailsSent: stats.sent,
    openRate,
    replyRate,
    bounceRate,
    recentCampaigns,
  });
}
