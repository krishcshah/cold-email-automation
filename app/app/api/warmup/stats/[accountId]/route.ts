import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { calculateHealthScore } from "@/lib/warmup/warmupRunner";

type Params = { params: { accountId: string } };

// GET /api/warmup/stats/[accountId]
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.emailAccount.findFirst({
    where: { id: params.accountId, userId },
  });

  if (!account) return apiError("Account not found", 404);

  const health = await calculateHealthScore(params.accountId);

  // Aggregate daily counts for activity graph (last 14 days)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentLogs = await prisma.warmupLog.findMany({
    where: {
      emailAccountId: params.accountId,
      occurredAt: { gte: fourteenDaysAgo },
    },
    orderBy: { occurredAt: "desc" },
  });

  const dailyMap = new Map<string, { sent: number; received: number; replied: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    dailyMap.set(dateStr, { sent: 0, received: 0, replied: 0 });
  }

  for (const log of recentLogs) {
    const dateStr = log.occurredAt.toISOString().split("T")[0];
    const entry = dailyMap.get(dateStr);
    if (entry) {
      if (log.action === "sent_warmup") entry.sent++;
      else if (log.action === "received_warmup") entry.received++;
      else if (log.action === "replied_warmup") entry.replied++;
    }
  }

  const activity = Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return apiSuccess({
    health,
    activity,
    recentLogs: recentLogs.slice(0, 50),
  });
}
