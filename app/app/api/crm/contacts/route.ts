import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { PipelineStage, Prisma } from "@prisma/client";

// GET /api/crm/contacts — list CRM contacts with optional stage or tag filter
export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const url = new URL(req.url);
  const stage = url.searchParams.get("stage") as PipelineStage | null;
  const tagId = url.searchParams.get("tagId");
  const search = url.searchParams.get("search");

  const where: Prisma.ContactWhereInput = { userId };
  if (stage) where.stage = stage;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }
  if (tagId) {
    where.contactTags = { some: { tagId } };
  }

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      contactTags: { include: { tag: true } },
      notes: { orderBy: { createdAt: "desc" }, take: 1 },
      tasks: { where: { completed: false } },
      callLogs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return apiSuccess(contacts);
}

// POST /api/crm/contacts — create a new CRM contact
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { email, firstName, lastName, company, title, phone, stage, dealValue, assignedToId } = body;

    if (!email) return apiError("Email is required");

    const contact = await prisma.contact.create({
      data: {
        userId,
        email: email.trim().toLowerCase(),
        firstName,
        lastName,
        company,
        title,
        phone,
        stage: stage || "new_lead",
        dealValue: dealValue ? Number(dealValue) : 0,
        assignedToId,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        actorName: "User",
        action: `Created contact ${contact.firstName || contact.email} (${contact.company || "No Company"})`,
        target: contact.id,
      },
    });

    return apiSuccess(contact, 201);
  } catch (err) {
    console.error("Create contact error:", err);
    return apiError("Failed to create contact", 500);
  }
}
