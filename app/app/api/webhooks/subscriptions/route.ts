import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import crypto from "crypto";

// GET /api/webhooks/subscriptions — list subscriptions
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const subs = await prisma.webhookSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(subs);
}

// POST /api/webhooks/subscriptions — subscribe to event webhook
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { url, events } = body;

    if (!url || !events) return apiError("Webhook URL and event types are required");

    const secret = "whsec_" + crypto.randomBytes(16).toString("hex");

    const sub = await prisma.webhookSubscription.create({
      data: {
        userId,
        url,
        events: Array.isArray(events) ? events.join(",") : events,
        secret,
      },
    });

    return apiSuccess(sub, 201);
  } catch (err) {
    console.error("Create webhook subscription error:", err);
    return apiError("Failed to save webhook subscription", 500);
  }
}

// DELETE /api/webhooks/subscriptions?id=xyz
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError("Subscription ID is required");

  const sub = await prisma.webhookSubscription.findFirst({
    where: { id, userId },
  });

  if (!sub) return apiError("Subscription not found", 404);

  await prisma.webhookSubscription.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
