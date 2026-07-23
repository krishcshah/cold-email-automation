import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function dispatchWebhookEvent(
  userId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const subscriptions = await prisma.webhookSubscription.findMany({
    where: { userId, status: "active" },
  });

  const matchingSubs = subscriptions.filter((sub) => {
    const events = sub.events.split(",").map((e) => e.trim());
    return events.includes("*") || events.includes(eventType);
  });

  for (const sub of matchingSubs) {
    const signature = crypto
      .createHmac("sha256", sub.secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    try {
      await fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OutreachPro-Signature": signature,
          "X-OutreachPro-Event": eventType,
        },
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });
    } catch (err) {
      console.error(`Webhook delivery error to ${sub.url}:`, err);
    }
  }
}
