import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/agency/branding?workspaceId=xyz
export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");

  const setting = await prisma.whiteLabelSetting.findFirst({
    where: workspaceId ? { workspaceId } : { workspace: { ownerId: userId } },
  });

  return apiSuccess(setting || null);
}

// POST /api/agency/branding — configure white-label branding
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { workspaceId, customDomain, companyName, logoUrl, faviconUrl, primaryColor, supportEmail, removeBranding } = body;

    if (!workspaceId) return apiError("Workspace ID is required");

    const setting = await prisma.whiteLabelSetting.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        customDomain,
        companyName: companyName || "OutreachPro",
        logoUrl,
        faviconUrl,
        primaryColor: primaryColor || "#0284c7",
        supportEmail,
        removeBranding: removeBranding ?? false,
      },
      update: {
        customDomain,
        companyName: companyName || "OutreachPro",
        logoUrl,
        faviconUrl,
        primaryColor: primaryColor || "#0284c7",
        supportEmail,
        removeBranding: removeBranding ?? false,
      },
    });

    return apiSuccess(setting);
  } catch (err) {
    console.error("Configure white-label branding error:", err);
    return apiError("Failed to save white-label branding settings", 500);
  }
}
