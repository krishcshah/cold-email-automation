import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/track/open/[token]
// Returns a 1x1 transparent pixel and marks the email as opened
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const event = await prisma.emailEvent.findFirst({
      where: { openToken: params.token },
    });

    if (event && event.type === "sent") {
      // Log opened event
      await prisma.emailEvent.create({
        data: {
          campaignId: event.campaignId,
          leadId: event.leadId,
          emailAccountId: event.emailAccountId,
          stepNumber: event.stepNumber,
          type: "opened",
          metadata: { trackedViaPixel: true },
        },
      });

      // Clear the token so it only tracks once
      await prisma.emailEvent.update({
        where: { id: event.id },
        data: { openToken: null },
      });
    }
  } catch {
    // Silently fail — tracking must never break the email experience
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
