import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { sendSmsViaTwilio } from "@/lib/outreach/twilio";

// POST /api/outreach/sms/send — send manual or automated SMS
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { toPhone, messageText } = body;

    if (!toPhone || !messageText) {
      return apiError("Recipient phone number and message text are required");
    }

    const result = await sendSmsViaTwilio(userId, toPhone, messageText);
    if (!result.success) {
      return apiError(result.error || "Failed to send SMS via Twilio", 400);
    }

    return apiSuccess({ sent: true, messageId: result.messageId });
  } catch (err) {
    console.error("Send SMS API error:", err);
    return apiError("Internal server error while sending SMS", 500);
  }
}
