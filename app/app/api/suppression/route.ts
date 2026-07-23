import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/suppression — list all suppression entries
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const entries = await prisma.suppressionEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(entries);
}

// POST /api/suppression — add a suppression entry (email or domain)
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { type, value, reason } = body;

    if (!value) return apiError("Value (email or domain) is required");

    const cleanValue = value.trim().toLowerCase();
    const entryType = type === "domain" ? "domain" : "email";

    const entry = await prisma.suppressionEntry.upsert({
      where: { userId_value: { userId, value: cleanValue } },
      create: { userId, type: entryType, value: cleanValue, reason },
      update: { type: entryType, reason },
    });

    return apiSuccess(entry, 201);
  } catch (err) {
    console.error("Create suppression entry error:", err);
    return apiError("Failed to save suppression entry", 500);
  }
}

// DELETE /api/suppression?id=xyz
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError("Entry ID is required");

  const entry = await prisma.suppressionEntry.findFirst({
    where: { id, userId },
  });

  if (!entry) return apiError("Entry not found", 404);

  await prisma.suppressionEntry.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
