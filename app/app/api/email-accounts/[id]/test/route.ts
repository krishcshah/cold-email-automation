import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { testSmtpConnection } from "@/lib/email/smtp";
import { testImapConnection } from "@/lib/email/imap";

// POST /api/email-accounts/[id]/test
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const account = await prisma.emailAccount.findFirst({
    where: { id: params.id, userId },
  });
  if (!account) return apiError("Account not found", 404);

  const smtpResult = await testSmtpConnection({
    host: account.smtpHost,
    port: account.smtpPort,
    user: account.smtpUser,
    pass: decrypt(account.smtpPass),
    fromName: account.fromName,
    fromEmail: account.fromEmail,
  });

  let imapResult: { ok: boolean; error?: string } = { ok: true };
  if (account.imapHost && account.imapPort && account.imapUser && account.imapPass) {
    imapResult = await testImapConnection({
      host: account.imapHost,
      port: account.imapPort,
      user: account.imapUser,
      pass: decrypt(account.imapPass),
    });
  }

  const overallOk = smtpResult.ok && imapResult.ok;

  await prisma.emailAccount.update({
    where: { id: params.id },
    data: {
      status: overallOk ? "active" : "error",
      lastTestedAt: new Date(),
    },
  });

  return apiSuccess({
    smtp: smtpResult,
    imap: imapResult,
    status: overallOk ? "active" : "error",
  });
}
