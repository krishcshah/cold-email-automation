import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/campaigns
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sequenceSteps: true } },
      campaignLeadLists: {
        include: { leadList: { select: { id: true, name: true } } },
      },
      campaignSenders: {
        include: { emailAccount: { select: { id: true, fromEmail: true, fromName: true } } },
      },
    },
  });

  return apiSuccess(campaigns);
}

// POST /api/campaigns — create a new campaign
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      name, leadListIds = [], senderIds = [],
      steps = [], dailyLimit, minDelaySecs, maxDelaySecs,
      sendDays, sendStartHour, sendEndHour, timezone,
      trackOpens, trackClicks,
    } = body;

    if (!name) return apiError("Campaign name is required");

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name,
        status: "draft",
        dailyLimit: dailyLimit ?? 50,
        minDelaySecs: minDelaySecs ?? 60,
        maxDelaySecs: maxDelaySecs ?? 180,
        sendDays: Array.isArray(sendDays) ? sendDays.join(",") : (sendDays ?? "1,2,3,4,5"),
        sendStartHour: sendStartHour ?? 9,
        sendEndHour: sendEndHour ?? 17,
        timezone: timezone ?? "UTC",
        trackOpens: trackOpens ?? true,
        trackClicks: trackClicks ?? true,
        campaignLeadLists: {
          create: leadListIds.map((id: string) => ({ leadListId: id })),
        },
        campaignSenders: {
          create: senderIds.map((id: string) => ({ emailAccountId: id })),
        },
        sequenceSteps: {
          create: steps.map((step: { subject: string; body: string; delayDays: number }, i: number) => ({
            stepNumber: i + 1,
            subject: step.subject,
            body: step.body,
            delayDays: step.delayDays ?? (i === 0 ? 0 : 2),
          })),
        },
      },
    });

    return apiSuccess({ id: campaign.id }, 201);
  } catch (err) {
    console.error("Create campaign error:", err);
    return apiError("Failed to create campaign", 500);
  }
}
