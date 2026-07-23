import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/email-accounts — list all accounts for current user
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const accounts = await prisma.emailAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, fromName: true, fromEmail: true,
      smtpHost: true, smtpPort: true, smtpUser: true,
      imapHost: true, imapPort: true, imapUser: true,
      status: true, lastTestedAt: true, createdAt: true,
    },
  });

  return apiSuccess(accounts);
}

// POST /api/email-accounts — create a single account
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const {
      fromName, fromEmail, smtpHost, smtpPort, smtpUser, smtpPass,
      imapHost, imapPort, imapUser, imapPass, customDomain,
    } = body;

    if (!fromName || !fromEmail || !smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return apiError("Missing required SMTP fields");
    }

    const account = await prisma.emailAccount.create({
      data: {
        userId,
        fromName,
        fromEmail,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        smtpPass: encrypt(smtpPass),
        imapHost: imapHost || null,
        imapPort: imapPort ? Number(imapPort) : null,
        imapUser: imapUser || null,
        imapPass: imapPass ? encrypt(imapPass) : null,
        customDomain: customDomain || null,
        status: "untested",
      },
    });

    return apiSuccess({ id: account.id }, 201);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Failed to create account";
    console.error("Create email account error:", err);
    return apiError(errMsg, 500);
  }
}
