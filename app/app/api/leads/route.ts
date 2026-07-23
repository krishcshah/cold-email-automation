import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";

// GET /api/leads — list all lead lists
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const lists = await prisma.leadList.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });

  return apiSuccess(
    lists.map((l) => ({
      id: l.id,
      name: l.name,
      createdAt: l.createdAt,
      leadCount: l._count.leads,
    }))
  );
}

// POST /api/leads — create lead list + import leads with flexible mapping
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { name, leads } = body as {
      name: string;
      leads: Array<{
        email: string;
        firstName?: string;
        lastName?: string;
        company?: string;
        title?: string;
        phone?: string;
        website?: string;
        customFields?: Record<string, string>;
      }>;
    };

    if (!name) return apiError("List name is required");
    if (!leads || leads.length === 0) return apiError("At least one lead is required");

    const list = await prisma.leadList.create({ data: { userId, name } });

    await prisma.lead.createMany({
      data: leads.map((item) => ({
        leadListId: list.id,
        email: item.email || "unspecified@domain.com",
        firstName: item.firstName || undefined,
        lastName: item.lastName || undefined,
        company: item.company || undefined,
        title: item.title || undefined,
        phone: item.phone || undefined,
        website: item.website || undefined,
        customFields: item.customFields && Object.keys(item.customFields).length > 0 ? item.customFields : undefined,
      })),
    });

    return apiSuccess({ id: list.id, name: list.name }, 201);
  } catch (err) {
    console.error("Create lead list error:", err);
    return apiError("Failed to create lead list", 500);
  }
}
