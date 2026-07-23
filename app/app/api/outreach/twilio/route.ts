import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/outreach/twilio — get Twilio integration details
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.twilioAccount.findUnique({
    where: { userId },
    select: {
      id: true,
      accountSid: true,
      phoneNumber: true,
      status: true,
      createdAt: true,
    },
  });

  return apiSuccess(account || null);
}

// POST /api/outreach/twilio — configure Twilio SID & Auth Token
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { accountSid, authToken, phoneNumber } = body;

    if (!accountSid || !authToken || !phoneNumber) {
      return apiError("Account SID, Auth Token, and Sender Phone Number are required");
    }

    const encryptedToken = encrypt(authToken);

    const account = await prisma.twilioAccount.upsert({
      where: { userId },
      create: {
        userId,
        accountSid,
        authToken: encryptedToken,
        phoneNumber,
      },
      update: {
        accountSid,
        authToken: encryptedToken,
        phoneNumber,
      },
    });

    return apiSuccess({
      id: account.id,
      accountSid: account.accountSid,
      phoneNumber: account.phoneNumber,
      status: account.status,
    });
  } catch (err) {
    console.error("Save Twilio config error:", err);
    return apiError("Failed to save Twilio configuration", 500);
  }
}
