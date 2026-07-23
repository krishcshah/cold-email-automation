import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess } from "@/lib/api";

// GET /api/team/activity — get activity feed stream for current workspace
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const activities = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess(activities);
}
