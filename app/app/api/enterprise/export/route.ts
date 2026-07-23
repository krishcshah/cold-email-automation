import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError } from "@/lib/api";

// GET /api/enterprise/export — export complete account data to JSON backup
export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        campaigns: { include: { sequenceSteps: true } },
        leadLists: { include: { leads: true } },
        emailAccounts: true,
        contacts: true,
        apiKeys: true,
        webhookSubscriptions: true,
      },
    });

    if (!user) return apiError("User not found", 404);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: { id: user.id, email: user.email, name: user.name },
      campaignsCount: user.campaigns.length,
      leadListsCount: user.leadLists.length,
      totalLeads: user.leadLists.reduce((acc, l) => acc + l.leads.length, 0),
      contactsCount: user.contacts.length,
      data: user,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="outreachpro-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err) {
    console.error("Export data error:", err);
    return apiError("Failed to generate account data export", 500);
  }
}
