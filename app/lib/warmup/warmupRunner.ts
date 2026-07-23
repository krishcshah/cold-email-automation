import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { sendEmail } from "@/lib/email/smtp";
import { checkDomainDns } from "@/lib/deliverability/dnsChecker";
import { checkBlacklists } from "@/lib/deliverability/blacklistChecker";
import { getRandomWarmupTemplate } from "./warmupTemplates";

export function calculateDailyTarget(
  startDate: Date,
  dailyLimit: number,
  rampUpDays: number,
  curve: "linear" | "exponential" = "linear"
): number {
  const daysDiff = Math.max(1, Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  if (daysDiff >= rampUpDays) return dailyLimit;

  const progressRatio = daysDiff / rampUpDays;
  if (curve === "exponential") {
    return Math.max(2, Math.floor(dailyLimit * Math.pow(progressRatio, 2)));
  }
  return Math.max(2, Math.floor(dailyLimit * progressRatio));
}

export async function calculateHealthScore(emailAccountId: string): Promise<{
  score: number;
  rating: "Excellent" | "Good" | "Needs Attention" | "Critical";
  factors: { name: string; score: number; max: number; status: string }[];
}> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
    include: {
      warmupSetting: true,
      warmupLogs: {
        where: { occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      },
      emailEvents: {
        where: { occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      },
    },
  });

  if (!account) {
    return {
      score: 50,
      rating: "Needs Attention",
      factors: [{ name: "Account", score: 0, max: 100, status: "Account not found" }],
    };
  }

  const domain = account.fromEmail.split("@")[1] || "";
  const [dns, bl] = await Promise.all([
    checkDomainDns(domain),
    checkBlacklists(domain),
  ]);

  let totalScore = 0;
  const factors: { name: string; score: number; max: number; status: string }[] = [];

  // 1. DNS Records (SPF + DMARC) - 35 points
  let dnsPoints = 0;
  if (dns.spfValid) dnsPoints += 20;
  if (dns.dmarcValid) dnsPoints += 15;
  totalScore += dnsPoints;
  factors.push({
    name: "DNS Authentication (SPF & DMARC)",
    score: dnsPoints,
    max: 35,
    status: dnsPoints === 35 ? "Valid" : dns.spfValid ? "DMARC missing" : "SPF missing",
  });

  // 2. Blacklist Status - 35 points
  const blPoints = bl.isBlacklisted ? 0 : 35;
  totalScore += blPoints;
  factors.push({
    name: "Domain Blacklist Status",
    score: blPoints,
    max: 35,
    status: bl.isBlacklisted ? "Blacklisted" : "Clean",
  });

  // 3. Warmup Activity & Reputation - 30 points
  const warmupActive = account.warmupSetting?.enabled ?? false;
  const warmupLogsCount = account.warmupLogs.length;
  let warmupPoints = 0;

  if (warmupActive && warmupLogsCount > 10) {
    warmupPoints = 30;
  } else if (warmupActive) {
    warmupPoints = 15;
  } else {
    warmupPoints = 5;
  }
  totalScore += warmupPoints;
  factors.push({
    name: "Warmup Network Activity",
    score: warmupPoints,
    max: 30,
    status: warmupActive ? (warmupLogsCount > 10 ? "Active & Healthy" : "Warming up") : "Disabled",
  });

  let rating: "Excellent" | "Good" | "Needs Attention" | "Critical" = "Excellent";
  if (totalScore < 50) rating = "Critical";
  else if (totalScore < 70) rating = "Needs Attention";
  else if (totalScore < 85) rating = "Good";

  return {
    score: totalScore,
    rating,
    factors,
  };
}

export async function runWarmupCycle(emailAccountId: string): Promise<{ sent: number; errors: string[] }> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
    include: { warmupSetting: true },
  });

  if (!account || !account.warmupSetting?.enabled) {
    return { sent: 0, errors: ["Warmup not enabled for this account"] };
  }

  const setting = account.warmupSetting;
  const targetToday = calculateDailyTarget(
    setting.createdAt,
    setting.dailyLimit,
    setting.rampUpDays,
    setting.rampUpCurve as "linear" | "exponential"
  );

  // Check how many warmup emails sent today
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const sentTodayCount = await prisma.warmupLog.count({
    where: {
      emailAccountId,
      action: "sent_warmup",
      occurredAt: { gte: todayStart },
    },
  });

  if (sentTodayCount >= targetToday) {
    return { sent: 0, errors: [] }; // Daily target reached
  }

  // Find peer accounts for warmup exchange (other enabled warmup accounts)
  const peerAccounts = await prisma.emailAccount.findMany({
    where: {
      id: { not: emailAccountId },
      status: "active",
      warmupSetting: { enabled: true },
    },
    take: 5,
  });

  if (peerAccounts.length === 0) {
    return { sent: 0, errors: ["No peer warmup accounts available in the network"] };
  }

  // Pick random peer account
  const peer = peerAccounts[Math.floor(Math.random() * peerAccounts.length)];
  const template = getRandomWarmupTemplate();
  const errors: string[] = [];

  try {
    // Send warmup email from account -> peer
    await sendEmail({
      smtpConfig: {
        host: account.smtpHost,
        port: account.smtpPort,
        user: account.smtpUser,
        pass: decrypt(account.smtpPass),
        fromName: account.fromName,
        fromEmail: account.fromEmail,
      },
      to: peer.fromEmail,
      subject: template.subject,
      html: template.body.replace(/\n/g, "<br>"),
      headers: {
        "X-Warmup-Email": "true",
      },
    });

    // Log sender action
    await prisma.warmupLog.create({
      data: {
        emailAccountId: account.id,
        peerAccountId: peer.id,
        peerEmail: peer.fromEmail,
        action: "sent_warmup",
        status: "success",
      },
    });

    // Log peer received action
    await prisma.warmupLog.create({
      data: {
        emailAccountId: peer.id,
        peerAccountId: account.id,
        peerEmail: account.fromEmail,
        action: "received_warmup",
        status: "success",
      },
    });

    // Simulate reply if reply rate roll passes
    const shouldReply = Math.random() * 100 <= setting.replyRate;
    if (shouldReply && peer.smtpHost && peer.smtpPass) {
      try {
        await sendEmail({
          smtpConfig: {
            host: peer.smtpHost,
            port: peer.smtpPort,
            user: peer.smtpUser,
            pass: decrypt(peer.smtpPass),
            fromName: peer.fromName,
            fromEmail: peer.fromEmail,
          },
          to: account.fromEmail,
          subject: template.replySubject,
          html: template.replyBody.replace(/\n/g, "<br>"),
          headers: {
            "X-Warmup-Reply": "true",
          },
        });

        await prisma.warmupLog.create({
          data: {
            emailAccountId: peer.id,
            peerAccountId: account.id,
            peerEmail: account.fromEmail,
            action: "replied_warmup",
            status: "success",
          },
        });
      } catch (replyErr) {
        console.error("Warmup peer reply error:", replyErr);
      }
    }

    return { sent: 1, errors };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    errors.push(errorMsg);

    await prisma.warmupLog.create({
      data: {
        emailAccountId: account.id,
        peerAccountId: peer.id,
        peerEmail: peer.fromEmail,
        action: "sent_warmup",
        status: "failed",
      },
    });

    return { sent: 0, errors };
  }
}
