export interface ProspectSearchCriteria {
  title?: string;
  seniority?: string;
  department?: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  techStack?: string;
}

export interface B2BProspectResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  company: string;
  industry: string;
  companySize: string;
  location: string;
  linkedInUrl: string;
  phone: string;
  techStack: string[];
  confidenceScore: number; // 0 - 100%
}

export async function searchB2BProspects(
  criteria: ProspectSearchCriteria
): Promise<B2BProspectResult[]> {
  const sampleProspects: B2BProspectResult[] = [
    {
      id: "prospect_1",
      firstName: "Sarah",
      lastName: "Jenkins",
      email: "sarah.jenkins@cloudscale.io",
      title: criteria.title || "VP of Engineering",
      company: criteria.companyName || "CloudScale Inc",
      industry: criteria.industry || "Software & SaaS",
      companySize: criteria.companySize || "51-200 employees",
      location: criteria.location || "San Francisco, CA",
      linkedInUrl: "https://linkedin.com/in/sarahjenkins-cloud",
      phone: "+1 (415) 555-0192",
      techStack: ["HubSpot", "Shopify", "React"],
      confidenceScore: 98,
    },
    {
      id: "prospect_2",
      firstName: "Marcus",
      lastName: "Vance",
      email: "m.vance@apexmarketing.com",
      title: "Chief Marketing Officer",
      company: "Apex Growth Marketing",
      industry: "Marketing & Advertising",
      companySize: "11-50 employees",
      location: "Austin, TX",
      linkedInUrl: "https://linkedin.com/in/marcusvance-apex",
      phone: "+1 (512) 555-0144",
      techStack: ["Salesforce", "Marketo", "WordPress"],
      confidenceScore: 94,
    },
    {
      id: "prospect_3",
      firstName: "Elena",
      lastName: "Rostova",
      email: "elena@fintechprime.eu",
      title: "Head of Operations",
      company: "FinTech Prime",
      industry: "Financial Services",
      companySize: "201-500 employees",
      location: "London, UK",
      linkedInUrl: "https://linkedin.com/in/elenarostova",
      phone: "+44 20 7946 0912",
      techStack: ["HubSpot", "Stripe", "Next.js"],
      confidenceScore: 91,
    },
  ];

  return sampleProspects.filter((p) => {
    if (criteria.title && !p.title.toLowerCase().includes(criteria.title.toLowerCase())) return false;
    if (criteria.companyName && !p.company.toLowerCase().includes(criteria.companyName.toLowerCase())) return false;
    if (criteria.industry && !p.industry.toLowerCase().includes(criteria.industry.toLowerCase())) return false;
    return true;
  });
}
