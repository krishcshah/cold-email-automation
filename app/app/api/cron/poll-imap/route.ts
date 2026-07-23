import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { fetchUnseenEmails } from "@/lib/email/imap";
import { isUnsubscribeReply } from "@/lib/email/templates";

function isOooReply(bodyText: string): boolean {
  const lower = bodyText.toLowerCase();
  const oooKeywords = [
    "out of office", "out-of-office", "on vacation", "annual leave",
    "away from my desk", "returning on", "back in the office", "limited access to email",
  ];
  return oooKeywords.some((kw) => lower.includes(kw));
}

// POST /api/cron/poll-imap
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.emailAccount.findMany({
    where: {
      imapHost: { not: null },
      imapPort: { not: null },
      imapUser: { not: null },
      imapPass: { not: null },
      status: "active",
    },
    include: {
      campaignSenders: {
        include: {
          campaign: {
            include: {
              leadCampaignStates: {
                include: { lead: true },
              },
            },
          },
        },
      },
    },
  });

  let totalRepliesFound = 0;

  for (const account of accounts) {
    if (!account.imapHost || !account.imapPort || !account.imapUser || !account.imapPass) {
      continue;
    }

    try {
      const emails = await fetchUnseenEmails(
        {
          host: account.imapHost,
          port: account.imapPort,
          user: account.imapUser,
          pass: decrypt(account.imapPass),
        },
        new Date(Date.now() - 48 * 60 * 60 * 1000)
      );

      for (const email of emails) {
        for (const cs of account.campaignSenders) {
          const campaign = cs.campaign;
          if (!campaign || campaign.status !== "active") continue;

          const matchingState = campaign.leadCampaignStates.find(
            (s) => s.lead.email.toLowerCase() === (email.from ?? "").toLowerCase()
          );

          if (!matchingState) continue;

          const existing = await prisma.inboxReply.findFirst({
            where: {
              leadId: matchingState.leadId,
              campaignId: campaign.id,
              messageId: email.messageId,
            },
          });
          if (existing) continue;

          const bodyStr = email.bodyText ?? "";
          const isUnsub = isUnsubscribeReply(bodyStr);
          const isOoo = isOooReply(bodyStr);

          const label = isUnsub ? "unsubscribed" : isOoo ? "ooo" : "none";

          await prisma.inboxReply.create({
            data: {
              campaignId: campaign.id,
              leadId: matchingState.leadId,
              emailAccountId: account.id,
              subject: email.subject ?? null,
              bodyText: bodyStr || null,
              receivedAt: email.date ?? new Date(),
              label: label as "unsubscribed" | "ooo" | "none",
              messageId: email.messageId,
              inReplyTo: email.inReplyTo ?? null,
            },
          });

          // Handle state updates
          if (isUnsub) {
            await prisma.leadCampaignState.update({
              where: { id: matchingState.id },
              data: { status: "unsubscribed" },
            });
            await prisma.lead.update({
              where: { id: matchingState.leadId },
              data: { status: "unsubscribed" },
            });
          } else if (isOoo) {
            // Auto-pause OOO leads for 7 days
            const resumeDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await prisma.leadCampaignState.update({
              where: { id: matchingState.id },
              data: { status: "paused_ooo", resumeAt: resumeDate },
            });
          } else {
            await prisma.leadCampaignState.update({
              where: { id: matchingState.id },
              data: { status: "replied" },
            });
          }

          await prisma.emailEvent.create({
            data: {
              campaignId: campaign.id,
              leadId: matchingState.leadId,
              emailAccountId: account.id,
              stepNumber: matchingState.currentStep,
              type: isUnsub ? "unsubscribed" : "replied",
            },
          });

          totalRepliesFound++;
        }
      }
    } catch (err) {
      console.error(`IMAP poll error for ${account.fromEmail}:`, err);
    }
  }

  return NextResponse.json({ processed: totalRepliesFound, at: new Date().toISOString() });
}
