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

// POST /api/leads — create lead list + import leads from JSON
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { name, leads } = body as {
      name: string;
      leads: Record<string, string>[];
    };

    if (!name) return apiError("List name is required");
    if (!leads || leads.length === 0) return apiError("At least one lead is required");

    const list = await prisma.leadList.create({ data: { userId, name } });

    await prisma.lead.createMany({
      data: leads.map((row) => {
        const {
          email = "",
          first_name,
          last_name,
          company,
          title,
          phone,
          website,
          ...rest
        } = row;

        const customFields = Object.keys(rest).length > 0 ? rest : undefined;

        return {
          leadListId: list.id,
          email,
          firstName: first_name ?? undefined,
          lastName: last_name ?? undefined,
          company: company ?? undefined,
          title: title ?? undefined,
          phone: phone ?? undefined,
          website: website ?? undefined,
          customFields,
        };
      }),
    });

    return apiSuccess({ id: list.id, name: list.name }, 201);
  } catch (err) {
    console.error("Create lead list error:", err);
    return apiError("Failed to create lead list", 500);
  }
}
