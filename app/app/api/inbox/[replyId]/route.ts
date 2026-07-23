import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { decrypt } from "@/lib/crypto";
import { sendEmail } from "@/lib/email/smtp";

type Params = { params: { replyId: string } };

// PATCH /api/inbox/[replyId] — update label or mark as read
export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const reply = await prisma.inboxReply.findUnique({
    where: { id: params.replyId },
    include: { campaign: { select: { userId: true } } },
  });

  if (!reply || reply.campaign.userId !== userId) {
    return apiError("Reply not found", 404);
  }

  const body = await req.json();

  const updated = await prisma.inboxReply.update({
    where: { id: params.replyId },
    data: {
      label: body.label ?? reply.label,
      isRead: body.isRead ?? reply.isRead,
    },
  });

  return apiSuccess({ updated: true, label: updated.label });
}

// POST /api/inbox/[replyId]/reply — send a reply from inbox
export async function POST(req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const inboxReply = await prisma.inboxReply.findUnique({
    where: { id: params.replyId },
    include: {
      campaign: { select: { userId: true } },
      lead: true,
      emailAccount: true,
    },
  });

  if (!inboxReply || inboxReply.campaign.userId !== userId) {
    return apiError("Reply not found", 404);
  }

  const body = await req.json();
  const { html, subject } = body;

  if (!html) return apiError("Reply body is required");

  try {
    await sendEmail({
      smtpConfig: {
        host: inboxReply.emailAccount.smtpHost,
        port: inboxReply.emailAccount.smtpPort,
        user: inboxReply.emailAccount.smtpUser,
        pass: decrypt(inboxReply.emailAccount.smtpPass),
        fromName: inboxReply.emailAccount.fromName,
        fromEmail: inboxReply.emailAccount.fromEmail,
      },
      to: inboxReply.lead.email,
      subject: subject ?? `Re: ${inboxReply.subject ?? ""}`,
      html,
      inReplyTo: inboxReply.messageId ?? undefined,
    });

    await prisma.inboxReply.update({
      where: { id: params.replyId },
      data: { repliedAt: new Date() },
    });

    return apiSuccess({ sent: true });
  } catch (err) {
    console.error("Inbox reply send error:", err);
    return apiError("Failed to send reply", 500);
  }
}
