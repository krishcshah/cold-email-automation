export interface AILeadContext {
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  website?: string;
  customFields?: Record<string, string>;
}

/**
 * Generates 5 high-converting subject line variants based on persona & goal.
 */
export async function generateSubjectVariants(goal: string, persona: string): Promise<string[]> {
  const cleanGoal = goal || "Schedule a quick intro call";
  const cleanPersona = persona || "B2B Decision Makers";

  return [
    `Quick question regarding ${cleanPersona}'s goals`,
    `Idea for ${cleanGoal.toLowerCase()}`,
    `Thought you might appreciate this, {{first_name}}`,
    `10 mins to discuss ${cleanGoal.toLowerCase()}?`,
    `{{company}} x OutreachPro — quick thought`,
  ];
}

/**
 * Generates email body copy based on persona, goal, and tone.
 */
export async function generateEmailBody(goal: string, persona: string, tone = "professional"): Promise<string> {
  const isCasual = tone === "casual";

  if (isCasual) {
    return `{Hey|Hi} {{first_name}},\n\nSaw what {{company}} is building and wanted to reach out. We've been helping ${persona} achieve ${goal.toLowerCase()}.\n\n{Would love to share a quick 2-minute video|Open to a quick 5-min chat next week?}\n\nBest,\n[Your Name]`;
  }

  return `Hi {{first_name}},\n\nI hope your week is going well.\n\nI reached out because we help ${persona} with ${goal.toLowerCase()}. Given your role as {{title | "Leader"}} at {{company}}, I thought this might align with your current priorities.\n\nWould you be open to a brief 10-minute intro call this Thursday?\n\nBest regards,\n[Your Name]`;
}

/**
 * Converts static email copy into spintax format.
 */
export function convertToSpintax(text: string): string {
  let spintax = text;

  const replacements = [
    { from: /\b(Hi|Hello|Hey)\b/gi, to: "{Hi|Hello|Hey}" },
    { from: /\b(Thanks|Thank you|Many thanks)\b/gi, to: "{Thanks|Thank you|Best}" },
    { from: /\b(quick|brief)\b/gi, to: "{quick|brief}" },
    { from: /\b(Reach out|Contact|Connect)\b/gi, to: "{Reach out|Connect|Touch base}" },
    { from: /\b(Best regards|Best|Cheers)\b/gi, to: "{Best regards|Best|Cheers}" },
  ];

  for (const r of replacements) {
    spintax = spintax.replace(r.from, r.to);
  }

  return spintax;
}

/**
 * Generates a personalized opening line/icebreaker for a lead.
 */
export function generateIcebreaker(lead: AILeadContext): string {
  const name = lead.firstName ?? "there";
  const company = lead.company ? ` at ${lead.company}` : "";
  const title = lead.title ? ` leading ${lead.title}` : "";

  const templates = [
    `Impressive growth at ${lead.company ?? "your team"}, ${name}!`,
    `Loved seeing your work${title}${company}, ${name}.`,
    `Came across your profile${company} and had to reach out.`,
    `Quick note to congratulate you on the progress${company}!`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}
