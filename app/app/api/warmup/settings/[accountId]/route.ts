import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

type Params = { params: { accountId: string } };

// GET /api/warmup/settings/[accountId]
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.emailAccount.findFirst({
    where: { id: params.accountId, userId },
    include: { warmupSetting: true },
  });

  if (!account) return apiError("Account not found", 404);

  // Return existing setting or default configuration
  const setting = account.warmupSetting ?? {
    enabled: false,
    dailyLimit: 40,
    rampUpDays: 30,
    rampUpCurve: "linear",
    replyRate: 35,
    importantRate: 20,
    spamRescueRate: 15,
  };

  return apiSuccess(setting);
}

// PATCH /api/warmup/settings/[accountId]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.emailAccount.findFirst({
    where: { id: params.accountId, userId },
  });

  if (!account) return apiError("Account not found", 404);

  const body = await req.json();
  const { enabled, dailyLimit, rampUpDays, rampUpCurve, replyRate, importantRate, spamRescueRate } = body;

  const updated = await prisma.warmupSetting.upsert({
    where: { emailAccountId: params.accountId },
    create: {
      emailAccountId: params.accountId,
      enabled: enabled ?? false,
      dailyLimit: dailyLimit ?? 40,
      rampUpDays: rampUpDays ?? 30,
      rampUpCurve: rampUpCurve ?? "linear",
      replyRate: replyRate ?? 35,
      importantRate: importantRate ?? 20,
      spamRescueRate: spamRescueRate ?? 15,
    },
    update: {
      enabled: enabled !== undefined ? enabled : undefined,
      dailyLimit: dailyLimit !== undefined ? Number(dailyLimit) : undefined,
      rampUpDays: rampUpDays !== undefined ? Number(rampUpDays) : undefined,
      rampUpCurve: rampUpCurve ?? undefined,
      replyRate: replyRate !== undefined ? Number(replyRate) : undefined,
      importantRate: importantRate !== undefined ? Number(importantRate) : undefined,
      spamRescueRate: spamRescueRate !== undefined ? Number(spamRescueRate) : undefined,
    },
  });

  return apiSuccess(updated);
}
