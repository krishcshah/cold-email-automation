import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "OutreachPro Public REST API",
      version: "1.0.0",
      description: "Full-stack Cold Email Automation & Multichannel Outreach Platform API",
    },
    servers: [{ url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000" }],
    paths: {
      "/api/prospecting/search": {
        post: { summary: "Search B2B Lead Database", responses: { 200: { description: "Matching prospects array" } } },
      },
      "/api/prospecting/finder": {
        post: { summary: "Find & Verify Email by Name and Domain", responses: { 200: { description: "Verified email result" } } },
      },
      "/api/crm/contacts": {
        get: { summary: "List CRM Contacts", responses: { 200: { description: "Contacts array" } } },
        post: { summary: "Create CRM Contact", responses: { 201: { description: "Created contact" } } },
      },
      "/api/integrations/clay": {
        post: { summary: "Clay Workflow Webhook Lead Ingestion", responses: { 201: { description: "Ingested lead count" } } },
      },
      "/api/keys": {
        get: { summary: "List User API Keys", responses: { 200: { description: "API keys array" } } },
        post: { summary: "Generate New API Key", responses: { 201: { description: "Generated key object" } } },
      },
    },
  };

  return NextResponse.json(openApiSpec);
}
