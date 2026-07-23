import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { searchB2BProspects } from "@/lib/enrichment/prospector";

// POST /api/prospecting/search — B2B lead database search
export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { title, seniority, department, companyName, industry, companySize, location, techStack } = body;

    const results = await searchB2BProspects({
      title,
      seniority,
      department,
      companyName,
      industry,
      companySize,
      location,
      techStack,
    });

    // Log Prospect Search
    await prisma.prospectSearchLog.create({
      data: {
        userId,
        query: body,
        results: results.length,
      },
    });

    return apiSuccess({
      results,
      count: results.length,
      availableCredits: 450,
    });
  } catch (err) {
    console.error("Prospect search error:", err);
    return apiError("Failed to perform prospect search", 500);
  }
}
