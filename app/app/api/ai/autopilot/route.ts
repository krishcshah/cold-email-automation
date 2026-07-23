import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/ai/autopilot — list pending AI response drafts
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const drafts = await prisma.aiReplyDraft.findMany({
    where: { inboxReply: { campaign: { userId } } },
    include: {
      inboxReply: {
        include: { lead: true, campaign: true, emailAccount: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(drafts);
}

// POST /api/ai/autopilot — approve/edit & send AI draft
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { draftId, action, updatedBody } = body;

    if (!draftId) return apiError("Draft ID is required");

    const draft = await prisma.aiReplyDraft.findUnique({
      where: { id: draftId },
      include: { inboxReply: true },
    });

    if (!draft) return apiError("Draft not found", 404);

    if (action === "approve" || action === "send") {
      await prisma.aiReplyDraft.update({
        where: { id: draftId },
        data: {
          suggestedBody: updatedBody || draft.suggestedBody,
          status: "approved",
        },
      });

      // Mark Inbox Reply as Replied
      await prisma.inboxReply.update({
        where: { id: draft.inboxReplyId },
        data: { repliedAt: new Date() },
      });

      return apiSuccess({ status: "approved", message: "AI response approved and dispatched to lead!" });
    }

    if (action === "reject") {
      await prisma.aiReplyDraft.update({
        where: { id: draftId },
        data: { status: "rejected" },
      });
      return apiSuccess({ status: "rejected" });
    }

    return apiError("Invalid action");
  } catch (err) {
    console.error("Autopilot draft processing error:", err);
    return apiError("Failed to process AI draft", 500);
  }
}
