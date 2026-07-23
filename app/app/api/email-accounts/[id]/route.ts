import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/email-accounts/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.emailAccount.findFirst({
    where: { id: params.id, userId },
    select: {
      id: true, fromName: true, fromEmail: true,
      smtpHost: true, smtpPort: true, smtpUser: true,
      imapHost: true, imapPort: true, imapUser: true,
      status: true, lastTestedAt: true, createdAt: true,
    },
  });

  if (!account) return apiError("Account not found", 404);
  return apiSuccess(account);
}

// PATCH /api/email-accounts/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.emailAccount.findFirst({
    where: { id: params.id, userId },
  });
  if (!account) return apiError("Account not found", 404);

  const body = await req.json();

  const updated = await prisma.emailAccount.update({
    where: { id: params.id },
    data: {
      fromName: body.fromName ?? account.fromName,
      fromEmail: body.fromEmail ?? account.fromEmail,
      smtpHost: body.smtpHost ?? account.smtpHost,
      smtpPort: body.smtpPort ? Number(body.smtpPort) : account.smtpPort,
      smtpUser: body.smtpUser ?? account.smtpUser,
      smtpPass: body.smtpPass ? encrypt(body.smtpPass) : account.smtpPass,
      imapHost: body.imapHost !== undefined ? body.imapHost : account.imapHost,
      imapPort: body.imapPort !== undefined ? (body.imapPort ? Number(body.imapPort) : null) : account.imapPort,
      imapUser: body.imapUser !== undefined ? body.imapUser : account.imapUser,
      imapPass: body.imapPass ? encrypt(body.imapPass) : account.imapPass,
    },
    select: { id: true },
  });

  return apiSuccess(updated);
}

// DELETE /api/email-accounts/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.emailAccount.findFirst({
    where: { id: params.id, userId },
  });
  if (!account) return apiError("Account not found", 404);

  await prisma.emailAccount.delete({ where: { id: params.id } });
  return apiSuccess({ deleted: true });
}
