import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { sendSlackNotification } from "@/lib/integrations/slack";

// GET /api/integrations/slack — get Slack integration setting
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const setting = await prisma.integrationSetting.findUnique({
    where: { userId_provider: { userId, provider: "slack" } },
  });

  return apiSuccess(setting || null);
}

// POST /api/integrations/slack — configure Slack Webhook URL & test
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { webhookUrl, enabled } = body;

    if (!webhookUrl) return apiError("Slack Webhook URL is required");

    const setting = await prisma.integrationSetting.upsert({
      where: { userId_provider: { userId, provider: "slack" } },
      create: {
        userId,
        provider: "slack",
        config: { webhookUrl },
        enabled: enabled !== undefined ? enabled : true,
      },
      update: {
        config: { webhookUrl },
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    // Send test notification
    await sendSlackNotification(userId, "Slack integration configured successfully!", "OutreachPro Alert Test");

    return apiSuccess(setting);
  } catch (err) {
    console.error("Configure Slack integration error:", err);
    return apiError("Failed to save Slack configuration", 500);
  }
}
