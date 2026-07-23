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
      name, leadListIds = [], senderIds = [], leadListId, emailAccountIds = [],
      steps = [], dailyLimit, minDelaySecs, maxDelaySecs,
      sendDays, sendStartHour, sendEndHour, timezone,
      trackOpens, trackClicks,
      // ReachInbox Options
      stopOnReply, stopOnDomainReply, bounceProtection, bounceThreshold,
      smartTimeGaps, maxNewLeadsPerDay, prioritizeNewLeads, autoOptimizeAZ,
      insertUnsubscribeHeader, unsubscribeBehavior, aiReplyAgentEnabled,
      textOnlyDelivery, providerMatching, strictProviderMatching, targetProviders,
      includeBlockquotes, positiveReplyNotification, notificationEmail,
      automatedOooReschedule, prospectValue, tags, ccEmails, bccEmails,
    } = body;

    if (!name) return apiError("Campaign name is required");

    const resolvedLeadListIds: string[] = leadListIds.length > 0 ? leadListIds : (leadListId ? [leadListId] : []);
    const resolvedSenderIds: string[] = senderIds.length > 0 ? senderIds : emailAccountIds;

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

        // ReachInbox Options
        stopOnReply: stopOnReply ?? true,
        stopOnDomainReply: stopOnDomainReply ?? false,
        bounceProtection: bounceProtection ?? true,
        bounceThreshold: bounceThreshold ?? 10,
        smartTimeGaps: smartTimeGaps ?? true,
        maxNewLeadsPerDay: maxNewLeadsPerDay ?? 500,
        prioritizeNewLeads: prioritizeNewLeads ?? false,
        autoOptimizeAZ: autoOptimizeAZ ?? false,
        insertUnsubscribeHeader: insertUnsubscribeHeader ?? true,
        unsubscribeBehavior: unsubscribeBehavior ?? "all",

        aiReplyAgentEnabled: aiReplyAgentEnabled ?? false,
        textOnlyDelivery: textOnlyDelivery ?? false,
        providerMatching: providerMatching ?? false,
        strictProviderMatching: strictProviderMatching ?? false,
        targetProviders: Array.isArray(targetProviders) ? targetProviders.join(",") : (targetProviders ?? "google,outlook,others"),
        includeBlockquotes: includeBlockquotes ?? true,
        positiveReplyNotification: positiveReplyNotification ?? false,
        notificationEmail: notificationEmail || null,
        automatedOooReschedule: automatedOooReschedule ?? true,
        prospectValue: prospectValue ? Number(prospectValue) : 500,

        tags: tags || null,
        ccEmails: ccEmails || null,
        bccEmails: bccEmails || null,

        campaignLeadLists: {
          create: resolvedLeadListIds.map((id: string) => ({ leadListId: id })),
        },
        campaignSenders: {
          create: resolvedSenderIds.map((id: string) => ({ emailAccountId: id })),
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
