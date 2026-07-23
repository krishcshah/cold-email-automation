import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { Client } from "@upstash/qstash";

const qstashToken = process.env.QSTASH_TOKEN;
const qstash = qstashToken ? new Client({ token: qstashToken }) : null;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// POST /api/campaigns/[id]/launch
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
    include: {
      sequenceSteps: { orderBy: { stepNumber: "asc" } },
      campaignLeadLists: {
        include: { leadList: { include: { leads: true } } },
      },
      campaignSenders: true,
    },
  });

  if (!campaign) return apiError("Campaign not found", 404);
  if (campaign.sequenceSteps.length === 0) return apiError("Add at least one email step before launching");
  if (campaign.campaignSenders.length === 0) return apiError("Add at least one sender account before launching");
  if (campaign.campaignLeadLists.length === 0) return apiError("Add at least one lead list before launching");

  // Collect all active leads across all selected lists
  const allLeads = campaign.campaignLeadLists.flatMap((cl) =>
    cl.leadList.leads.filter((l) => l.status === "active")
  );

  if (allLeads.length === 0) return apiError("No active leads in the selected lists");

  // Create LeadCampaignState for all leads (skip existing ones)
  const existingStates = await prisma.leadCampaignState.findMany({
    where: { campaignId: campaign.id },
    select: { leadId: true },
  });
  const existingLeadIds = new Set(existingStates.map((s) => s.leadId));

  const newLeads = allLeads.filter((l) => !existingLeadIds.has(l.id));

  if (newLeads.length > 0) {
    await prisma.leadCampaignState.createMany({
      data: newLeads.map((lead) => ({
        campaignId: campaign.id,
        leadId: lead.id,
        currentStep: 1,
        status: "active",
      })),
    });
  }

  // Update campaign status to active
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "active" },
  });

  // Enqueue job via QStash or direct local background fetch fallback
  try {
    if (qstash && qstashToken) {
      await qstash.publishJSON({
        url: `${APP_URL}/api/jobs/process-campaign`,
        body: { campaignId: campaign.id },
        delay: 2,
      });
    } else {
      // Local fallback: Trigger process-campaign endpoint directly in background
      fetch(`${APP_URL}/api/jobs/process-campaign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id }),
      }).catch((err) => console.error("Local background job trigger failed:", err));
    }
  } catch (queueErr) {
    console.warn("Queue trigger warning (proceeding with campaign launch):", queueErr);
  }

  return apiSuccess({
    launched: true,
    status: "active",
    leadsEnrolled: newLeads.length,
    totalLeads: allLeads.length,
  });
}
