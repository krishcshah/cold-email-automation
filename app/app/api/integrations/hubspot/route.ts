import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/integrations/hubspot
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const setting = await prisma.integrationSetting.findUnique({
    where: { userId_provider: { userId, provider: "hubspot" } },
  });

  return apiSuccess(setting || null);
}

// POST /api/integrations/hubspot — configure HubSpot API Key
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { apiKey, enabled } = body;

    if (!apiKey) return apiError("HubSpot Access Token / API Key is required");

    const setting = await prisma.integrationSetting.upsert({
      where: { userId_provider: { userId, provider: "hubspot" } },
      create: {
        userId,
        provider: "hubspot",
        apiKey,
        enabled: enabled !== undefined ? enabled : true,
      },
      update: {
        apiKey,
        enabled: enabled !== undefined ? enabled : true,
      },
    });

    return apiSuccess(setting);
  } catch (err) {
    console.error("Configure HubSpot integration error:", err);
    return apiError("Failed to save HubSpot configuration", 500);
  }
}
