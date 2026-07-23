import { NextRequest } from "next/server";
import { requireAuth, apiError, apiSuccess } from "@/lib/api";
import { checkDomainDns } from "@/lib/deliverability/dnsChecker";

// POST /api/deliverability/dns-check
export async function POST(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const { domain } = body;
    if (!domain) return apiError("Domain is required");

    const result = await checkDomainDns(domain);
    return apiSuccess(result);
  } catch (err) {
    console.error("DNS check API error:", err);
    return apiError("Failed to check domain DNS records", 500);
  }
}
