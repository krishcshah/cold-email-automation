export interface WarmupTemplate {
  subject: string;
  body: string;
  replySubject: string;
  replyBody: string;
}

export const WARMUP_TEMPLATES: WarmupTemplate[] = [
  {
    subject: "Quick feedback on project timeline",
    body: "Hi there,\n\nJust following up on our discussion yesterday regarding the Q3 project roadmap. Do you have 5 minutes to review the draft outline?\n\nBest regards,",
    replySubject: "Re: Quick feedback on project timeline",
    replyBody: "Thanks for checking in! The draft looks solid to me. Let's proceed as planned.\n\nBest,",
  },
  {
    subject: "Meeting notes and next steps",
    body: "Hi team,\n\nHere are the quick takeaways from this morning's sync:\n1. Review quarterly deliverables\n2. Finalize vendor proposals\n\nLet me know if I missed anything.",
    replySubject: "Re: Meeting notes and next steps",
    replyBody: "Got it! Thanks for circulating the notes. I will handle task #2 by end of day.",
  },
  {
    subject: "Introduction & networking call",
    body: "Hi,\n\nHope your week is off to a great start. I noticed your work in business operations and would love to connect for a quick 10-minute coffee chat if you're open to it.\n\nCheers,",
    replySubject: "Re: Introduction & networking call",
    replyBody: "Hi! Thanks for reaching out. I'd be glad to connect next week. Feel free to send over an invite.",
  },
  {
    subject: "Confirmation on resource allocation",
    body: "Hello,\n\nCould you confirm if the updated budget sheet reflects the additional design resources allocated for next month?\n\nThanks,",
    replySubject: "Re: Confirmation on resource allocation",
    replyBody: "Yes, the budget sheet has been updated with the new design line items. Let me know if you need anything else.",
  },
  {
    subject: "Updated schedule for tomorrow",
    body: "Hi,\n\nJust a quick heads-up that our sync tomorrow will be moved to 2:00 PM EST. Please let me know if that time still works for you.",
    replySubject: "Re: Updated schedule for tomorrow",
    replyBody: "2:00 PM EST works great for me. See you then!",
  },
];

export function getRandomWarmupTemplate(): WarmupTemplate {
  const index = Math.floor(Math.random() * WARMUP_TEMPLATES.length);
  return WARMUP_TEMPLATES[index];
}
