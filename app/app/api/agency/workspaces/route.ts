import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/agency/workspaces — list client workspaces for agency owner
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: userId },
    include: { whiteLabelSetting: true },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(workspaces);
}

// POST /api/agency/workspaces — create new client workspace
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { name, clientName, clientEmail, sendingCreditsLimit, enrichmentCreditsLimit } = body;

    if (!name) return apiError("Workspace name is required");

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.floor(Math.random() * 1000);

    const workspace = await prisma.workspace.create({
      data: {
        ownerId: userId,
        name,
        slug,
        clientName,
        clientEmail,
        sendingCreditsLimit: sendingCreditsLimit ? Number(sendingCreditsLimit) : 10000,
        enrichmentCreditsLimit: enrichmentCreditsLimit ? Number(enrichmentCreditsLimit) : 500,
        whiteLabelSetting: {
          create: {
            companyName: clientName || name,
            primaryColor: "#0284c7",
          },
        },
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        actorName: "Agency Admin",
        actorEmail: clientEmail || "admin@agency.com",
        actionType: "workspace.created",
        details: `Created workspace ${name} for client ${clientName || name}`,
      },
    });

    return apiSuccess(workspace, 201);
  } catch (err) {
    console.error("Create workspace error:", err);
    return apiError("Failed to create client workspace", 500);
  }
}
