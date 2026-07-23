import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import Papa from "papaparse";

// POST /api/email-accounts/import — bulk CSV upload
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("No file uploaded");

    const text = await file.text();
    const { data, errors } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0) {
      return apiError(`CSV parse error: ${errors[0].message}`);
    }

    const required = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "from_email", "from_name"];
    const first = data[0] ?? {};
    const missing = required.filter((k) => !(k in first));
    if (missing.length > 0) {
      return apiError(`Missing CSV columns: ${missing.join(", ")}`);
    }

    const created: string[] = [];
    const errors2: string[] = [];

    for (const row of data) {
      try {
        const account = await prisma.emailAccount.create({
          data: {
            userId,
            fromName: row.from_name ?? "",
            fromEmail: row.from_email ?? "",
            smtpHost: row.smtp_host ?? "",
            smtpPort: Number(row.smtp_port) || 587,
            smtpUser: row.smtp_user ?? "",
            smtpPass: encrypt(row.smtp_pass ?? ""),
            imapHost: row.imap_host || null,
            imapPort: row.imap_port ? Number(row.imap_port) : null,
            imapUser: row.imap_user || null,
            imapPass: row.imap_pass ? encrypt(row.imap_pass) : null,
            status: "untested",
          },
        });
        created.push(account.id);
      } catch {
        errors2.push(row.from_email ?? "unknown");
      }
    }

    return apiSuccess({ created: created.length, failed: errors2 }, 201);
  } catch (err) {
    console.error("CSV import error:", err);
    return apiError("Failed to import accounts", 500);
  }
}
