import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

type Params = { params: { listId: string } };

// GET /api/leads/[listId]
export async function GET(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const list = await prisma.leadList.findFirst({
    where: { id: params.listId, userId },
    include: {
      _count: { select: { leads: true } },
    },
  });

  if (!list) return apiError("Lead list not found", 404);
  return apiSuccess({ ...list, leadCount: list._count.leads });
}

// DELETE /api/leads/[listId]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const list = await prisma.leadList.findFirst({
    where: { id: params.listId, userId },
  });
  if (!list) return apiError("Lead list not found", 404);

  await prisma.leadList.delete({ where: { id: params.listId } });
  return apiSuccess({ deleted: true });
}
