import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { WorkspaceRole } from "@prisma/client";

// GET /api/team/members — list team members for current workspace
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const members = await prisma.workspaceMember.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(members);
}

// POST /api/team/members — invite a new team member
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { email, name, role } = body;

    if (!email) return apiError("Email is required");

    const validRole: WorkspaceRole = role === "admin" ? "admin" : role === "viewer" ? "viewer" : "member";

    const member = await prisma.workspaceMember.create({
      data: {
        ownerId: userId,
        email: email.trim().toLowerCase(),
        name,
        role: validRole,
        status: "invited",
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId,
        actorName: "Admin",
        action: `Invited ${email} as ${validRole.toUpperCase()}`,
        target: member.id,
      },
    });

    return apiSuccess(member, 201);
  } catch (err) {
    console.error("Invite team member error:", err);
    return apiError("Failed to invite team member", 500);
  }
}

// DELETE /api/team/members?id=xyz
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return apiError("Member ID is required");

  const member = await prisma.workspaceMember.findFirst({
    where: { id, ownerId: userId },
  });

  if (!member) return apiError("Member not found", 404);

  await prisma.workspaceMember.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
