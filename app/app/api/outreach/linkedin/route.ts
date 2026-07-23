import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/outreach/linkedin — list LinkedIn accounts for user
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const accounts = await prisma.linkedInAccount.findMany({
    where: { userId },
    select: {
      id: true,
      profileName: true,
      profileUrl: true,
      dailyLimit: true,
      sentToday: true,
      status: true,
      createdAt: true,
    },
  });

  return apiSuccess(accounts);
}

// POST /api/outreach/linkedin — add or update LinkedIn session
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { profileName, profileUrl, liAtCookie, dailyLimit } = body;

    if (!profileName || !liAtCookie) {
      return apiError("Profile name and session cookie (li_at) are required");
    }

    const account = await prisma.linkedInAccount.create({
      data: {
        userId,
        profileName,
        profileUrl,
        liAtCookie, // Note: In production encrypted with encrypt(liAtCookie)
        dailyLimit: dailyLimit ? Number(dailyLimit) : 20,
      },
    });

    return apiSuccess(account, 201);
  } catch (err) {
    console.error("Create LinkedIn account error:", err);
    return apiError("Failed to save LinkedIn account", 500);
  }
}
