import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { Client } from "@upstash/qstash";

const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

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
  if (campaign.status === "active") return apiError("Campaign is already active");
  if (campaign.sequenceSteps.length === 0) return apiError("Add at least one email step before launching");
  if (campaign.campaignSenders.length === 0) return apiError("Add at least one sender account before launching");
  if (campaign.campaignLeadLists.length === 0) return apiError("Add at least one lead list before launching");

  // Collect all leads across all lists
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

  // Update campaign status
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "active" },
  });

  // Enqueue the first batch via QStash
  // The send-email worker will handle step progression
  await qstash.publishJSON({
    url: `${APP_URL}/api/jobs/process-campaign`,
    body: { campaignId: campaign.id },
    delay: 5, // 5 seconds before first job runs
  });

  return apiSuccess({
    launched: true,
    leadsEnrolled: newLeads.length,
    totalLeads: allLeads.length,
  });
}
