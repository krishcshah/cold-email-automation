import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { sendEmail } from "@/lib/email/smtp";
import { substituteVariables, buildVariableMap, injectTracking } from "@/lib/email/templates";
import { resolveSpintax } from "@/lib/email/spintax";
import { Client } from "@upstash/qstash";
import crypto from "crypto";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

interface JobPayload {
  campaignId: string;
}

function getProvider(emailOrHost: string): "google" | "microsoft" | "other" {
  const lower = emailOrHost.toLowerCase();
  if (lower.includes("gmail") || lower.includes("google")) return "google";
  if (lower.includes("outlook") || lower.includes("hotmail") || lower.includes("office365") || lower.includes("microsoft")) return "microsoft";
  return "other";
}

// POST /api/jobs/process-campaign
export async function POST(req: NextRequest) {
  const body = await req.json() as JobPayload;
  const { campaignId } = body;

  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaignId" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      sequenceSteps: {
        orderBy: { stepNumber: "asc" },
        include: { variants: true },
      },
      campaignSenders: {
        include: { emailAccount: true },
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  if (campaign.status !== "active") {
    return NextResponse.json({ skipped: true, reason: campaign.status });
  }

  // Get user's suppression list (email + domain)
  const suppressionEntries = await prisma.suppressionEntry.findMany({
    where: { userId: campaign.userId },
  });
  const suppressedEmails = new Set(suppressionEntries.filter((s) => s.type === "email").map((s) => s.value.toLowerCase()));
  const suppressedDomains = new Set(suppressionEntries.filter((s) => s.type === "domain").map((s) => s.value.toLowerCase()));

  // Get user's custom snippets
  const snippets = await prisma.snippet.findMany({
    where: { userId: campaign.userId },
  });
  const snippetMap = new Map(snippets.map((s) => [s.name, s.content]));

  // Check current time against send window
  const now = new Date();
  const hour = now.getUTCHours();
  if (hour < campaign.sendStartHour || hour >= campaign.sendEndHour) {
    await qstash.publishJSON({
      url: `${APP_URL}/api/jobs/process-campaign`,
      body: { campaignId },
      delay: 3600,
    });
    return NextResponse.json({ skipped: true, reason: "outside_send_window" });
  }

  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const allowedDays = campaign.sendDays.split(",").map(Number);
  if (!allowedDays.includes(dayOfWeek)) {
    await qstash.publishJSON({
      url: `${APP_URL}/api/jobs/process-campaign`,
      body: { campaignId },
      delay: 3600 * 12,
    });
    return NextResponse.json({ skipped: true, reason: "wrong_day" });
  }

  const pendingStates = await prisma.leadCampaignState.findMany({
    where: {
      campaignId,
      status: { in: ["active", "paused_ooo"] },
    },
    take: 10,
    include: { lead: true },
  });

  if (pendingStates.length === 0) {
    return NextResponse.json({ done: true, reason: "no_pending_leads" });
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const todaySentCounts = await prisma.emailEvent.groupBy({
    by: ["emailAccountId"],
    where: {
      campaignId,
      type: "sent",
      occurredAt: { gte: todayStart },
    },
    _count: { emailAccountId: true },
  });

  const sentMap = new Map(todaySentCounts.map((r) => [r.emailAccountId, r._count.emailAccountId]));
  let emailsSentThisRun = 0;

  for (const state of pendingStates) {
    const lead = state.lead;

    // 1. OOO Resume check
    if (state.status === "paused_ooo") {
      if (state.resumeAt && now < state.resumeAt) {
        continue; // Still on OOO hold
      }
      // Resume lead to active
      await prisma.leadCampaignState.update({
        where: { id: state.id },
        data: { status: "active", resumeAt: null },
      });
    }

    // 2. Global Suppression Filter Check
    const leadDomain = lead.email.split("@")[1]?.toLowerCase() || "";
    if (suppressedEmails.has(lead.email.toLowerCase()) || suppressedDomains.has(leadDomain)) {
      await prisma.leadCampaignState.update({
        where: { id: state.id },
        data: { status: "unsubscribed" },
      });
      continue;
    }

    const step = campaign.sequenceSteps.find((s) => s.stepNumber === state.currentStep);
    if (!step) continue;

    // 3. Condition-based Sequence Branching Check
    if (state.currentStep > 1) {
      if (step.condition !== "always") {
        const prevEvents = await prisma.emailEvent.findMany({
          where: { campaignId, leadId: lead.id, stepNumber: state.currentStep - 1 },
          select: { type: true },
        });
        const hasOpened = prevEvents.some((e) => e.type === "opened");
        const hasClicked = prevEvents.some((e) => e.type === "clicked");

        if (step.condition === "if_opened" && !hasOpened) continue;
        if (step.condition === "if_not_opened" && hasOpened) continue;
        if (step.condition === "if_clicked" && !hasClicked) continue;
      }

      if (state.lastEmailSentAt) {
        const dueSince = new Date(state.lastEmailSentAt);
        dueSince.setDate(dueSince.getDate() + step.delayDays);
        if (now < dueSince) continue;
      }
    }

    // Pick sender account (Smart rotation + ESP matching)
    const eligibleSenders = campaign.campaignSenders.filter((s) => {
      const sent = sentMap.get(s.emailAccountId) ?? 0;
      return sent < campaign.dailyLimit;
    });

    if (eligibleSenders.length === 0) break;

    const leadProvider = getProvider(lead.email);
    const espMatchedSender = eligibleSenders.find(
      (s) => getProvider(s.emailAccount.fromEmail) === leadProvider || getProvider(s.emailAccount.smtpHost) === leadProvider
    );

    const selectedSender = espMatchedSender ?? eligibleSenders.sort((a, b) => {
      const sentA = sentMap.get(a.emailAccountId) ?? 0;
      const sentB = sentMap.get(b.emailAccountId) ?? 0;
      return sentA - sentB;
    })[0];

    const account = selectedSender.emailAccount;

    try {
      // 4. A/B Testing Variant Selection
      let stepSubject = step.subject;
      let stepBody = step.body;
      let selectedVariant: typeof step.variants[0] | null = null;

      if (step.variants.length > 0) {
        // Alternate between variants
        const variantIndex = state.id.charCodeAt(state.id.length - 1) % (step.variants.length + 1);
        if (variantIndex < step.variants.length) {
          selectedVariant = step.variants[variantIndex];
          stepSubject = selectedVariant.subject;
          stepBody = selectedVariant.body;
        }
      }

      // 5. Replace Reusable Snippets {{snippet:name}}
      stepBody = stepBody.replace(/\{\{snippet:([a-zA-Z0-9_]+)\}\}/g, (_, snippetName: string) => {
        return snippetMap.get(snippetName) || "";
      });

      // 6. Variable substitution & Spintax resolution
      const varMap = buildVariableMap(lead as Parameters<typeof buildVariableMap>[0]);
      let subject = substituteVariables(stepSubject, varMap);
      let html = substituteVariables(stepBody, varMap);

      // Resolve spintax variations {Option A|Option B}
      subject = resolveSpintax(subject);
      html = resolveSpintax(html);

      const unsubToken = await prisma.unsubscribeToken.create({
        data: { leadId: lead.id, campaignId },
      });

      html += `<br><br><a href="${APP_URL}/api/unsubscribe/${unsubToken.token}" style="color:#999;font-size:11px">Unsubscribe</a>`;

      const openToken = crypto.randomBytes(16).toString("hex");
      const emailEvent = await prisma.emailEvent.create({
        data: {
          campaignId,
          leadId: lead.id,
          emailAccountId: account.id,
          stepNumber: state.currentStep,
          type: "sent",
          openToken: campaign.trackOpens ? openToken : null,
          metadata: selectedVariant ? { variantId: selectedVariant.id, variantLetter: selectedVariant.variantLetter } : undefined,
        },
      });

      if (selectedVariant) {
        await prisma.sequenceStepVariant.update({
          where: { id: selectedVariant.id },
          data: { sentCount: { increment: 1 } },
        });
      }

      const trackingAppUrl = account.customDomain ? `https://${account.customDomain}` : APP_URL;

      html = injectTracking(html, {
        openToken: campaign.trackOpens ? openToken : undefined,
        appUrl: trackingAppUrl,
        trackOpens: campaign.trackOpens,
        trackClicks: campaign.trackClicks,
        emailEventId: emailEvent.id,
      });

      await sendEmail({
        smtpConfig: {
          host: account.smtpHost,
          port: account.smtpPort,
          user: account.smtpUser,
          pass: decrypt(account.smtpPass),
          fromName: account.fromName,
          fromEmail: account.fromEmail,
        },
        to: lead.email,
        subject,
        html,
        headers: {
          "X-Campaign-Id": campaignId,
          "X-Lead-Id": lead.id,
        },
      });

      sentMap.set(account.id, (sentMap.get(account.id) ?? 0) + 1);
      emailsSentThisRun++;

      const nextStep = campaign.sequenceSteps.find(
        (s) => s.stepNumber === state.currentStep + 1
      );

      await prisma.leadCampaignState.update({
        where: { id: state.id },
        data: {
          currentStep: nextStep ? state.currentStep + 1 : state.currentStep,
          status: nextStep ? "active" : "completed",
          lastEmailSentAt: new Date(),
        },
      });

      const delay = Math.floor(
        Math.random() * (campaign.maxDelaySecs - campaign.minDelaySecs) +
          campaign.minDelaySecs
      );
      await new Promise((r) => setTimeout(r, delay * 1000));
    } catch (err) {
      console.error(`Failed to send to ${lead.email}:`, err);
    }
  }

  const remaining = await prisma.leadCampaignState.count({
    where: { campaignId, status: "active" },
  });

  if (remaining > 0) {
    await qstash.publishJSON({
      url: `${APP_URL}/api/jobs/process-campaign`,
      body: { campaignId },
      delay: 120,
    });
  }

  return NextResponse.json({ processed: emailsSentThisRun, remaining });
}
