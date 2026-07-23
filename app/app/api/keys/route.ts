import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import crypto from "crypto";

// GET /api/keys — list API keys
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, name: true, key: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(keys);
}

// POST /api/keys — generate new API key
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { name } = body;
    if (!name) return apiError("API key name is required");

    const rawToken = "op_live_" + crypto.randomBytes(24).toString("hex");

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        key: rawToken,
      },
    });

    return apiSuccess(apiKey, 201);
  } catch (err) {
    console.error("Create API key error:", err);
    return apiError("Failed to generate API key", 500);
  }
}

// DELETE /api/keys?id=xyz
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError("Key ID is required");

  const key = await prisma.apiKey.findFirst({
    where: { id, userId },
  });

  if (!key) return apiError("API key not found", 404);

  await prisma.apiKey.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
