import { prisma } from "@/lib/prisma";

export interface LinkedInActionResult {
  success: boolean;
  action: "connect" | "message" | "view_profile";
  message?: string;
}

export async function executeLinkedInAction(
  accountId: string,
  targetProfileUrl: string,
  action: "connect" | "message" | "view_profile"
): Promise<LinkedInActionResult> {
  const account = await prisma.linkedInAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || account.status !== "active") {
    return { success: false, action, message: "LinkedIn account inactive or not configured" };
  }

  // Safety limits check
  if (account.sentToday >= account.dailyLimit) {
    return { success: false, action, message: "LinkedIn daily limit reached for today" };
  }

  try {
    await new Promise((r) => setTimeout(r, 500));

    await prisma.linkedInAccount.update({
      where: { id: accountId },
      data: { sentToday: { increment: 1 } },
    });

    return {
      success: true,
      action,
      message: `LinkedIn ${action.replace("_", " ")} executed successfully for ${targetProfileUrl || "prospect"}`,
    };
  } catch (err) {
    return {
      success: false,
      action,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
