import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import crypto from "crypto";

// GET /api/reports — list shareable reports
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const reports = await prisma.shareableReport.findMany({
    where: { workspace: { ownerId: userId } },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(reports);
}

// POST /api/reports — create new shareable report token
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { title, campaignIds, workspaceId } = body;

    if (!title || !workspaceId) return apiError("Report title and workspace ID are required");

    const token = "rep_" + crypto.randomBytes(16).toString("hex");

    const report = await prisma.shareableReport.create({
      data: {
        workspaceId,
        token,
        title,
        campaignIds: Array.isArray(campaignIds) ? campaignIds.join(",") : campaignIds || "",
      },
    });

    return apiSuccess(report, 201);
  } catch (err) {
    console.error("Create report error:", err);
    return apiError("Failed to generate shareable client report", 500);
  }
}
