import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess } from "@/lib/api";

// GET /api/security/audit — list workspace audit logs
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const logs = await prisma.auditLog.findMany({
    where: { workspace: { ownerId: userId } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return apiSuccess(logs);
}
