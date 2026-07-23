"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Code, Key, Copy, Check } from "lucide-react";

export default function ApiDocsPage() {
  const [copied, setCopied] = useState(false);

  const sampleCurl = `curl -X POST "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/prospecting/search" \\
  -H "Authorization: Bearer op_live_your_api_token" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "VP of Sales",
    "industry": "Software & SaaS"
  }'`;

  function copyCurl() {
    navigator.clipboard.writeText(sampleCurl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings/api" className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">OutreachPro REST API Reference</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Programmatic API documentation for lead database prospecting, CRM sync, and webhooks</p>
        </div>
      </div>

      {/* Authentication Guide */}
      <div className="glass rounded-xl p-6 border border-border space-y-3">
        <h2 className="font-bold text-foreground text-base flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" /> Authentication
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          All REST API requests require a secret API key passed via the <code className="text-primary font-mono">Authorization</code> header as a Bearer token or <code className="text-primary font-mono">X-API-Key</code> header.
        </p>
        <div className="p-3 rounded-lg bg-secondary/60 font-mono text-xs text-foreground border border-border">
          Authorization: Bearer op_live_xxxxxxxxxxxxxxxxxxxxxxxx
        </div>
      </div>

      {/* Quickstart Code Example */}
      <div className="glass rounded-xl p-6 border border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground text-base flex items-center gap-2">
            <Code className="w-5 h-5 text-emerald-400" /> Quickstart cURL Request
          </h2>
          <button onClick={copyCurl} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy cURL"}
          </button>
        </div>
        <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800">
          {sampleCurl}
        </pre>
      </div>

      {/* Endpoints Table */}
      <div className="glass rounded-xl p-6 border border-border space-y-4">
        <h2 className="font-bold text-foreground text-base flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" /> Primary Endpoints
        </h2>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">POST</span>
              <span className="font-mono text-xs font-bold text-foreground">/api/prospecting/search</span>
            </div>
            <p className="text-xs text-muted-foreground">Search B2B lead database by job title, company size, industry, location, and tech stack.</p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">POST</span>
              <span className="font-mono text-xs font-bold text-foreground">/api/prospecting/finder</span>
            </div>
            <p className="text-xs text-muted-foreground">Find and verify B2B email addresses with MX check and catch-all detection.</p>
          </div>

          <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">POST</span>
              <span className="font-mono text-xs font-bold text-foreground">/api/integrations/clay</span>
            </div>
            <p className="text-xs text-muted-foreground">Public webhook endpoint for Clay workflows to ingest leads directly into lead lists.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
