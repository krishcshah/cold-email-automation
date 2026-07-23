import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// POST /api/crm/contacts/[id]/calls — log call outcome
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { outcome, notes } = body; // "connected" | "voicemail" | "no_answer"

    if (!outcome) return apiError("Call outcome is required");

    const contact = await prisma.contact.findFirst({
      where: { id: params.id, userId },
      include: { lead: true },
    });

    if (!contact) return apiError("Contact not found", 404);

    const callLog = await prisma.callLog.create({
      data: {
        contactId: params.id,
        outcome,
        notes,
        loggedByName: "Teammate",
      },
    });

    // Auto-advance campaign sequence step if lead is in active campaign
    if (contact.leadId) {
      const states = await prisma.leadCampaignState.findMany({
        where: { leadId: contact.leadId, status: "active" },
      });

      for (const s of states) {
        await prisma.leadCampaignState.update({
          where: { id: s.id },
          data: {
            currentStep: s.currentStep + 1,
            lastEmailSentAt: new Date(),
          },
        });
      }
    }

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        actorName: "User",
        action: `Logged call outcome (${outcome.toUpperCase()}) for ${contact.firstName || contact.email}`,
        target: contact.id,
      },
    });

    return apiSuccess(callLog, 201);
  } catch (err) {
    console.error("Log call outcome error:", err);
    return apiError("Failed to log call outcome", 500);
  }
}
