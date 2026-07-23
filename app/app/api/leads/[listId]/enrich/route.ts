import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { enrichAndSaveLead } from "@/lib/enrichment/waterfall";

// POST /api/leads/[listId]/enrich — bulk waterfall lead enrichment
export async function POST(
  req: NextRequest,
  { params }: { params: { listId: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const leadList = await prisma.leadList.findFirst({
    where: { id: params.listId, userId },
    include: { leads: true },
  });

  if (!leadList) return apiError("Lead list not found", 404);

  let enrichedCount = 0;
  for (const lead of leadList.leads) {
    const success = await enrichAndSaveLead(lead.id);
    if (success) enrichedCount++;
  }

  return apiSuccess({
    enriched: enrichedCount,
    total: leadList.leads.length,
    message: `Waterfall enrichment completed for ${enrichedCount} leads`,
  });
}
