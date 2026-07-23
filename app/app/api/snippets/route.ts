import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/snippets — list all snippets for current user
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const snippets = await prisma.snippet.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });

  return apiSuccess(snippets);
}

// POST /api/snippets — create or update a snippet
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { name, content } = body;

    if (!name || !content) return apiError("Name and content are required");

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const snippet = await prisma.snippet.upsert({
      where: { userId_name: { userId, name: cleanName } },
      create: { userId, name: cleanName, content },
      update: { content },
    });

    return apiSuccess(snippet, 201);
  } catch (err) {
    console.error("Create snippet error:", err);
    return apiError("Failed to save snippet", 500);
  }
}

// DELETE /api/snippets?id=xyz
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError("Snippet ID is required");

  const snippet = await prisma.snippet.findFirst({
    where: { id, userId },
  });

  if (!snippet) return apiError("Snippet not found", 404);

  await prisma.snippet.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
