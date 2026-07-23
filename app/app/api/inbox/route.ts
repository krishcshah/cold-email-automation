import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess } from "@/lib/api";

// GET /api/inbox?page=1&limit=20&label=all
export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Number(url.searchParams.get("label") ?? "20"));
  const label = url.searchParams.get("label") ?? "all";
  const skip = (page - 1) * limit;

  // Get all campaign IDs belonging to this user
  const userCampaigns = await prisma.campaign.findMany({
    where: { userId },
    select: { id: true },
  });
  const campaignIds = userCampaigns.map((c) => c.id);

  const where = {
    campaignId: { in: campaignIds },
    ...(label !== "all" ? { label: label as "none" | "interested" | "not_interested" | "meeting_booked" | "unsubscribed" } : {}),
  };

  const [replies, total] = await Promise.all([
    prisma.inboxReply.findMany({
      where,
      skip,
      take: limit,
      orderBy: { receivedAt: "desc" },
      include: {
        lead: { select: { email: true, firstName: true, lastName: true, company: true } },
        campaign: { select: { name: true } },
        emailAccount: { select: { fromEmail: true, fromName: true } },
      },
    }),
    prisma.inboxReply.count({ where }),
  ]);

  return apiSuccess({ replies, total, page, limit });
}
