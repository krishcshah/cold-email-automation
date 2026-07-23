import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/crm/contacts/[id] — get contact detail with full activity timeline
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const contact = await prisma.contact.findFirst({
    where: { id: params.id, userId },
    include: {
      contactTags: { include: { tag: true } },
      notes: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      callLogs: { orderBy: { createdAt: "desc" } },
      lead: {
        include: {
          emailEvents: { orderBy: { occurredAt: "desc" } },
          inboxReplies: { orderBy: { receivedAt: "desc" } },
        },
      },
    },
  });

  if (!contact) return apiError("Contact not found", 404);

  return apiSuccess(contact);
}

// PATCH /api/crm/contacts/[id] — update contact stage, deal value, tags, assigned member
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { stage, dealValue, assignedToId, tagIds, firstName, lastName, company, title, phone } = body;

    const contact = await prisma.contact.findFirst({
      where: { id: params.id, userId },
    });

    if (!contact) return apiError("Contact not found", 404);

    const updated = await prisma.contact.update({
      where: { id: params.id },
      data: {
        stage: stage !== undefined ? stage : undefined,
        dealValue: dealValue !== undefined ? Number(dealValue) : undefined,
        assignedToId: assignedToId !== undefined ? assignedToId : undefined,
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        company: company !== undefined ? company : undefined,
        title: title !== undefined ? title : undefined,
        phone: phone !== undefined ? phone : undefined,
      },
    });

    if (Array.isArray(tagIds)) {
      await prisma.contactTag.deleteMany({ where: { contactId: params.id } });
      if (tagIds.length > 0) {
        await prisma.contactTag.createMany({
          data: tagIds.map((tagId: string) => ({ contactId: params.id, tagId })),
        });
      }
    }

    if (stage && stage !== contact.stage) {
      await prisma.activityLog.create({
        data: {
          userId,
          actorName: "User",
          action: `Moved ${contact.firstName || contact.email} to ${stage.replace("_", " ").toUpperCase()}`,
          target: contact.id,
        },
      });
    }

    return apiSuccess(updated);
  } catch (err) {
    console.error("Update contact error:", err);
    return apiError("Failed to update contact", 500);
  }
}

// DELETE /api/crm/contacts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const contact = await prisma.contact.findFirst({
    where: { id: params.id, userId },
  });

  if (!contact) return apiError("Contact not found", 404);

  await prisma.contact.delete({ where: { id: params.id } });
  return apiSuccess({ deleted: true });
}
