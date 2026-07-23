import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/unsubscribe/[token]
// One-click unsubscribe handler
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const unsub = await prisma.unsubscribeToken.findUnique({
      where: { token: params.token },
      include: { lead: true },
    });

    if (!unsub || unsub.usedAt) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>Already Unsubscribed</h2><p>This link has already been used.</p></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Mark token as used
    await prisma.unsubscribeToken.update({
      where: { token: params.token },
      data: { usedAt: new Date() },
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: unsub.leadId },
      data: { status: "unsubscribed" },
    });

    // Update lead campaign state
    await prisma.leadCampaignState.updateMany({
      where: { leadId: unsub.leadId, campaignId: unsub.campaignId },
      data: { status: "unsubscribed" },
    });

    // Log unsubscribe event
    const sentEvent = await prisma.emailEvent.findFirst({
      where: { leadId: unsub.leadId, campaignId: unsub.campaignId, type: "sent" },
      orderBy: { occurredAt: "desc" },
    });

    if (sentEvent) {
      await prisma.emailEvent.create({
        data: {
          campaignId: unsub.campaignId,
          leadId: unsub.leadId,
          emailAccountId: sentEvent.emailAccountId,
          stepNumber: sentEvent.stepNumber,
          type: "unsubscribed",
        },
      });
    }

    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#0f0f0f;color:#eee">
      <h2 style="color:#22c55e">✓ Unsubscribed Successfully</h2>
      <p>You've been removed from our mailing list and won't receive further emails.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return new NextResponse("Error processing unsubscribe", { status: 500 });
  }
}
