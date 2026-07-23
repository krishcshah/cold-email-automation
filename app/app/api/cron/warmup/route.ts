import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runWarmupCycle } from "@/lib/warmup/warmupRunner";

// POST /api/cron/warmup
// Called by Cloudflare Cron Trigger or QStash scheduled job
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enabledSettings = await prisma.warmupSetting.findMany({
    where: { enabled: true },
    select: { emailAccountId: true },
  });

  let totalSent = 0;
  const logResults: { accountId: string; sent: number; errors: string[] }[] = [];

  for (const s of enabledSettings) {
    try {
      const res = await runWarmupCycle(s.emailAccountId);
      totalSent += res.sent;
      logResults.push({ accountId: s.emailAccountId, sent: res.sent, errors: res.errors });
    } catch (err) {
      logResults.push({
        accountId: s.emailAccountId,
        sent: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }

  return NextResponse.json({
    processedAccounts: enabledSettings.length,
    totalSent,
    results: logResults,
    at: new Date().toISOString(),
  });
}
