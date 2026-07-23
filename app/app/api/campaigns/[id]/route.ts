import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

type Params = { params: { id: string } };

// GET /api/campaigns/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
    include: {
      sequenceSteps: { orderBy: { stepNumber: "asc" } },
      campaignLeadLists: {
        include: { leadList: { select: { id: true, name: true } } },
      },
      campaignSenders: {
        include: {
          emailAccount: { select: { id: true, fromEmail: true, fromName: true } },
        },
      },
    },
  });

  if (!campaign) return apiError("Campaign not found", 404);
  return apiSuccess(campaign);
}

// PATCH /api/campaigns/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
  });
  if (!campaign) return apiError("Campaign not found", 404);

  const body = await req.json();
  const {
    name, leadListIds, senderIds, steps,
    dailyLimit, minDelaySecs, maxDelaySecs,
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

  // Update in a transaction
  await prisma.$transaction(async (tx) => {
    await tx.campaign.update({
      where: { id: params.id },
      data: {
        name: name ?? campaign.name,
        dailyLimit: dailyLimit ?? campaign.dailyLimit,
        minDelaySecs: minDelaySecs ?? campaign.minDelaySecs,
        maxDelaySecs: maxDelaySecs ?? campaign.maxDelaySecs,
        sendDays: Array.isArray(sendDays) ? sendDays.join(",") : (sendDays ?? campaign.sendDays),
        sendStartHour: sendStartHour ?? campaign.sendStartHour,
        sendEndHour: sendEndHour ?? campaign.sendEndHour,
        timezone: timezone ?? campaign.timezone,
        trackOpens: trackOpens ?? campaign.trackOpens,
        trackClicks: trackClicks ?? campaign.trackClicks,

        stopOnReply: stopOnReply ?? campaign.stopOnReply,
        stopOnDomainReply: stopOnDomainReply ?? campaign.stopOnDomainReply,
        bounceProtection: bounceProtection ?? campaign.bounceProtection,
        bounceThreshold: bounceThreshold ?? campaign.bounceThreshold,
        smartTimeGaps: smartTimeGaps ?? campaign.smartTimeGaps,
        maxNewLeadsPerDay: maxNewLeadsPerDay ?? campaign.maxNewLeadsPerDay,
        prioritizeNewLeads: prioritizeNewLeads ?? campaign.prioritizeNewLeads,
        autoOptimizeAZ: autoOptimizeAZ ?? campaign.autoOptimizeAZ,
        insertUnsubscribeHeader: insertUnsubscribeHeader ?? campaign.insertUnsubscribeHeader,
        unsubscribeBehavior: unsubscribeBehavior ?? campaign.unsubscribeBehavior,

        aiReplyAgentEnabled: aiReplyAgentEnabled ?? campaign.aiReplyAgentEnabled,
        textOnlyDelivery: textOnlyDelivery ?? campaign.textOnlyDelivery,
        providerMatching: providerMatching ?? campaign.providerMatching,
        strictProviderMatching: strictProviderMatching ?? campaign.strictProviderMatching,
        targetProviders: Array.isArray(targetProviders) ? targetProviders.join(",") : (targetProviders ?? campaign.targetProviders),
        includeBlockquotes: includeBlockquotes ?? campaign.includeBlockquotes,
        positiveReplyNotification: positiveReplyNotification ?? campaign.positiveReplyNotification,
        notificationEmail: notificationEmail ?? campaign.notificationEmail,
        automatedOooReschedule: automatedOooReschedule ?? campaign.automatedOooReschedule,
        prospectValue: prospectValue ? Number(prospectValue) : campaign.prospectValue,

        tags: tags ?? campaign.tags,
        ccEmails: ccEmails ?? campaign.ccEmails,
        bccEmails: bccEmails ?? campaign.bccEmails,
      },
    });

    if (leadListIds) {
      await tx.campaignLeadList.deleteMany({ where: { campaignId: params.id } });
      await tx.campaignLeadList.createMany({
        data: leadListIds.map((id: string) => ({ campaignId: params.id, leadListId: id })),
      });
    }

    if (senderIds) {
      await tx.campaignSender.deleteMany({ where: { campaignId: params.id } });
      await tx.campaignSender.createMany({
        data: senderIds.map((id: string) => ({ campaignId: params.id, emailAccountId: id })),
      });
    }

    if (steps) {
      await tx.sequenceStep.deleteMany({ where: { campaignId: params.id } });
      await tx.sequenceStep.createMany({
        data: steps.map((s: { subject: string; body: string; delayDays: number }, i: number) => ({
          campaignId: params.id,
          stepNumber: i + 1,
          subject: s.subject,
          body: s.body,
          delayDays: s.delayDays ?? 0,
        })),
      });
    }
  });

  return apiSuccess({ updated: true });
}

// DELETE /api/campaigns/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
  });
  if (!campaign) return apiError("Campaign not found", 404);

  await prisma.campaign.delete({ where: { id: params.id } });
  return apiSuccess({ deleted: true });
}
