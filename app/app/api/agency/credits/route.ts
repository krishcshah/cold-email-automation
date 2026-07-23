import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// POST /api/agency/credits — allocate sending & enrichment credits per client
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { workspaceId, sendingCreditsLimit, enrichmentCreditsLimit } = body;

    if (!workspaceId) return apiError("Workspace ID is required");

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        sendingCreditsLimit: sendingCreditsLimit !== undefined ? Number(sendingCreditsLimit) : undefined,
        enrichmentCreditsLimit: enrichmentCreditsLimit !== undefined ? Number(enrichmentCreditsLimit) : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId,
        actorName: "Agency Admin",
        actorEmail: "admin@agency.com",
        actionType: "credits.allocated",
        details: `Updated credit limits: Sending limit ${workspace.sendingCreditsLimit}, Enrichment limit ${workspace.enrichmentCreditsLimit}`,
      },
    });

    return apiSuccess(workspace);
  } catch (err) {
    console.error("Allocate credits error:", err);
    return apiError("Failed to allocate workspace credits", 500);
  }
}
