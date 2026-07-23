import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// POST /api/enterprise/gdpr — GDPR right-to-be-forgotten deletion request
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { targetEmail } = body;

    if (!targetEmail) return apiError("Target lead email is required for GDPR deletion");

    const cleanEmail = targetEmail.trim().toLowerCase();

    // 1. Delete matching lead records
    await prisma.lead.deleteMany({ where: { email: cleanEmail } });

    // 2. Add to Suppression Entry
    await prisma.suppressionEntry.upsert({
      where: { userId_value: { userId, value: cleanEmail } },
      create: { userId, type: "email", value: cleanEmail, reason: "GDPR Right-to-be-forgotten" },
      update: { reason: "GDPR Right-to-be-forgotten" },
    });

    // 3. Log GDPR Request
    const reqLog = await prisma.gdprDeletionRequest.create({
      data: { userId, targetEmail: cleanEmail, status: "completed" },
    });

    return apiSuccess({
      message: `Lead data for ${cleanEmail} permanently deleted and suppressed per GDPR compliance`,
      log: reqLog,
    });
  } catch (err) {
    console.error("GDPR deletion error:", err);
    return apiError("Failed to execute GDPR deletion request", 500);
  }
}
