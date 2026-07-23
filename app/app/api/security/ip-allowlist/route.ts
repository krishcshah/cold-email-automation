import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/security/ip-allowlist
export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const workspaceId = url.searchParams.get("workspaceId");

  const ips = await prisma.ipAllowlist.findMany({
    where: workspaceId ? { workspaceId } : { workspace: { ownerId: userId } },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(ips);
}

// POST /api/security/ip-allowlist — add allowed IP address
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { workspaceId, ipAddress, label } = body;

    if (!workspaceId || !ipAddress) {
      return apiError("Workspace ID and IP address are required");
    }

    const entry = await prisma.ipAllowlist.create({
      data: { workspaceId, ipAddress, label },
    });

    return apiSuccess(entry, 201);
  } catch (err) {
    console.error("Add IP allowlist error:", err);
    return apiError("Failed to add IP allowlist entry", 500);
  }
}

// DELETE /api/security/ip-allowlist?id=xyz
export async function DELETE(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError("Entry ID is required");

  await prisma.ipAllowlist.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
