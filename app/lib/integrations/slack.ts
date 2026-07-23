import { prisma } from "@/lib/prisma";

export async function sendSlackNotification(
  userId: string,
  message: string,
  title?: string
): Promise<boolean> {
  const setting = await prisma.integrationSetting.findUnique({
    where: { userId_provider: { userId, provider: "slack" } },
  });

  if (!setting || !setting.enabled || !setting.config) return false;

  const config = setting.config as { webhookUrl?: string };
  if (!config.webhookUrl) return false;

  try {
    const res = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: title ? `*${title}*\n${message}` : message,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Slack notification error:", err);
    return false;
  }
}
