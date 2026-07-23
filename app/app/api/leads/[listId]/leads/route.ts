import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

type Params = { params: { listId: string } };

// GET /api/leads/[listId]/leads?page=1&limit=50
export async function GET(req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const list = await prisma.leadList.findFirst({
    where: { id: params.listId, userId },
  });
  if (!list) return apiError("Lead list not found", 404);

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Number(url.searchParams.get("limit") ?? "50"));
  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where: { leadListId: params.listId },
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
    }),
    prisma.lead.count({ where: { leadListId: params.listId } }),
  ]);

  return apiSuccess({ leads, total, page, limit });
}
