import { prisma } from "@/lib/prisma";

export interface AutopilotCategoryResult {
  category: "interested" | "meeting_request" | "question" | "not_interested" | "ooo" | "referral";
  suggestedBody: string;
  autoActionTaken?: string;
}

export async function processReplyAutopilot(
  inboxReplyId: string,
  replyText: string,
  leadName?: string
): Promise<AutopilotCategoryResult> {
  const lower = replyText.toLowerCase();
  const name = leadName || "there";

  let category: AutopilotCategoryResult["category"] = "interested";
  let suggestedBody = `Hi ${name},\n\nThanks for following up! I'd love to jump on a quick 15-minute call to show you how OutreachPro can scale your outbound. Does Thursday at 2 PM EST work for you?`;

  if (lower.includes("not interested") || lower.includes("unsubscribe") || lower.includes("remove me")) {
    category = "not_interested";
    suggestedBody = `Hi ${name},\n\nGot it, I have removed you from our list. Have a great week!`;
  } else if (lower.includes("calendar") || lower.includes("book") || lower.includes("call") || lower.includes("time")) {
    category = "meeting_request";
    suggestedBody = `Hi ${name},\n\nAwesome! Here is my direct calendar link to book a time that works best for you: https://cal.com/outreachpro/15min\n\nLooking forward to speaking!`;
  } else if (lower.includes("pricing") || lower.includes("cost") || lower.includes("how much") || lower.includes("features")) {
    category = "question";
    suggestedBody = `Hi ${name},\n\nGreat question! Our platform starts at $99/mo including unlimited warmup accounts and B2B lead enrichment. I've attached a quick product breakdown for you. Let me know if you have any questions!`;
  }

  // Save AI Draft in DB
  await prisma.aiReplyDraft.upsert({
    where: { inboxReplyId },
    create: {
      inboxReplyId,
      category,
      suggestedBody,
      status: "pending_approval",
    },
    update: {
      category,
      suggestedBody,
      status: "pending_approval",
    },
  });

  return { category, suggestedBody };
}
