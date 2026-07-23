import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// POST /api/crm/contacts/[id]/tasks — add a task to contact profile
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { title, dueDate } = body;
    if (!title) return apiError("Task title is required");

    const contact = await prisma.contact.findFirst({
      where: { id: params.id, userId },
    });
    if (!contact) return apiError("Contact not found", 404);

    const task = await prisma.contactTask.create({
      data: {
        contactId: params.id,
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return apiSuccess(task, 201);
  } catch (err) {
    console.error("Create task error:", err);
    return apiError("Failed to add task", 500);
  }
}
