import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api";

// POST /api/integrations/clay — Clay workflow lead ingestion webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listId, leads } = body;

    if (!listId || !Array.isArray(leads)) {
      return apiError("Lead list ID (listId) and an array of leads are required");
    }

    const leadList = await prisma.leadList.findUnique({ where: { id: listId } });
    if (!leadList) return apiError("Target lead list not found", 404);

    let createdCount = 0;
    for (const item of leads) {
      if (!item.email) continue;
      const cleanEmail = item.email.trim().toLowerCase();

      await prisma.lead.create({
        data: {
          leadListId: listId,
          email: cleanEmail,
          firstName: item.firstName || item.first_name,
          lastName: item.lastName || item.last_name,
          company: item.company,
          title: item.title,
          phone: item.phone,
          website: item.website,
          customFields: item.customFields || null,
        },
      });
      createdCount++;
    }

    return apiSuccess({
      imported: createdCount,
      message: `Successfully ingested ${createdCount} leads from Clay workflow`,
    }, 201);
  } catch (err) {
    console.error("Clay lead ingestion error:", err);
    return apiError("Failed to ingest leads from Clay", 500);
  }
}
