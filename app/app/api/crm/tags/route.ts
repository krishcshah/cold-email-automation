import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/crm/tags — list tags
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return apiSuccess(tags);
}

// POST /api/crm/tags — create tag
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { name, color } = body;
    if (!name) return apiError("Tag name is required");

    const cleanName = name.trim();
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name: cleanName } },
      create: { userId, name: cleanName, color: color || "#10b981" },
      update: { color: color || "#10b981" },
    });

    return apiSuccess(tag, 201);
  } catch (err) {
    console.error("Create tag error:", err);
    return apiError("Failed to save tag", 500);
  }
}

// DELETE /api/crm/tags?id=xyz
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError("Tag ID is required");

  const tag = await prisma.tag.findFirst({
    where: { id, userId },
  });

  if (!tag) return apiError("Tag not found", 404);

  await prisma.tag.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
