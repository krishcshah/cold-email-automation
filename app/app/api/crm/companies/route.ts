import { prisma } from "@/lib/prisma";
import { requireAuth, apiSuccess } from "@/lib/api";

// GET /api/crm/companies — group contacts by company name
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const contacts = await prisma.contact.findMany({
    where: { userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      company: true,
      title: true,
      stage: true,
      dealValue: true,
    },
  });

  const companyMap = new Map<string, {
    company: string;
    contactCount: number;
    totalDealValue: number;
    contacts: typeof contacts;
  }>();

  for (const c of contacts) {
    const compName = c.company ? c.company.trim() : "Unassigned Company";
    const existing = companyMap.get(compName) || {
      company: compName,
      contactCount: 0,
      totalDealValue: 0,
      contacts: [],
    };

    existing.contactCount += 1;
    existing.totalDealValue += c.dealValue || 0;
    existing.contacts.push(c);
    companyMap.set(compName, existing);
  }

  const result = Array.from(companyMap.values()).sort(
    (a, b) => b.totalDealValue - a.totalDealValue
  );

  return apiSuccess(result);
}
