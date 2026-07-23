import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/track/click/[token]
// Logs click event and redirects to the original URL
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  let redirectUrl = "/";

  try {
    const decoded = JSON.parse(
      Buffer.from(params.token, "base64url").toString("utf8")
    ) as { eventId: string; url: string };

    redirectUrl = decoded.url;

    const sentEvent = await prisma.emailEvent.findUnique({
      where: { id: decoded.eventId },
    });

    if (sentEvent) {
      await prisma.emailEvent.create({
        data: {
          campaignId: sentEvent.campaignId,
          leadId: sentEvent.leadId,
          emailAccountId: sentEvent.emailAccountId,
          stepNumber: sentEvent.stepNumber,
          type: "clicked",
          metadata: { url: decoded.url },
        },
      });
    }
  } catch {
    // Silently fail
  }

  return NextResponse.redirect(redirectUrl, { status: 302 });
}
