import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// POST /api/crm/contacts/[id]/notes — add a note to contact profile
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { content } = body;
    if (!content) return apiError("Note content is required");

    const contact = await prisma.contact.findFirst({
      where: { id: params.id, userId },
    });
    if (!contact) return apiError("Contact not found", 404);

    const note = await prisma.contactNote.create({
      data: {
        contactId: params.id,
        authorName: "Teammate",
        content,
      },
    });

    return apiSuccess(note, 201);
  } catch (err) {
    console.error("Create note error:", err);
    return apiError("Failed to add note", 500);
  }
}
