import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { validateEmail } from "@/lib/deliverability/emailValidator";

type Params = { params: { listId: string } };

// POST /api/leads/[listId]/validate — bulk validate all leads in a list
export async function POST(_req: NextRequest, { params }: Params) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const list = await prisma.leadList.findFirst({
    where: { id: params.listId, userId },
    include: { leads: true },
  });

  if (!list) return apiError("Lead list not found", 404);

  let validCount = 0;
  let invalidCount = 0;

  for (const lead of list.leads) {
    const res = await validateEmail(lead.email);
    if (!res.isValid) {
      invalidCount++;
      await prisma.lead.update({
        where: { id: lead.id },
        data: { status: "bounced" }, // mark invalid emails as bounced so campaigns skip them
      });
    } else {
      validCount++;
    }
  }

  return apiSuccess({
    total: list.leads.length,
    valid: validCount,
    invalid: invalidCount,
    validPercentage: list.leads.length > 0 ? Math.round((validCount / list.leads.length) * 100) : 0,
  });
}
