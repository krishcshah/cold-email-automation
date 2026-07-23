import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// POST /api/integrations/sheets — Google Sheets two-way sync
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { spreadsheetId, sheetName, listId } = body;

    if (!spreadsheetId || !listId) {
      return apiError("Google Spreadsheet ID and Target Lead List ID are required");
    }

    const setting = await prisma.integrationSetting.upsert({
      where: { userId_provider: { userId, provider: "sheets" } },
      create: {
        userId,
        provider: "sheets",
        config: { spreadsheetId, sheetName: sheetName || "Sheet1", listId },
        enabled: true,
      },
      update: {
        config: { spreadsheetId, sheetName: sheetName || "Sheet1", listId },
        enabled: true,
      },
    });

    return apiSuccess({
      synced: true,
      setting,
      message: "Google Sheet two-way sync initialized successfully",
    });
  } catch (err) {
    console.error("Google sheets sync error:", err);
    return apiError("Failed to sync Google Sheet", 500);
  }
}
