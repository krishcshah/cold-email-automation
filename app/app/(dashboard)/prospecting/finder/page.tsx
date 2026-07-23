"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailSearch, CheckCircle2, AlertTriangle, Upload } from "lucide-react";

interface FinderResult {
  email: string;
  confidenceScore: number;
  syntaxValid: boolean;
  mxFound: boolean;
  isCatchAll: boolean;
  verificationStatus: "valid" | "risky" | "invalid";
}

export default function EmailFinderPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FinderResult | null>(null);

  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !domain) return;
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/prospecting/finder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, domain }),
    });

    if (res.ok) {
      setResult(await res.json());
    }
    setLoading(false);
  }

  const inputClass = "w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/prospecting" className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Finder & Verifier</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Find verified B2B email addresses by Name + Company Domain</p>
        </div>
      </div>

      {/* Single Email Finder */}
      <div className="glass rounded-xl p-6 border border-border space-y-4 max-w-2xl">
        <h2 className="font-semibold text-foreground text-base flex items-center gap-2">
          <MailSearch className="w-5 h-5 text-primary" /> Single Email Finder
        </h2>
        <form onSubmit={handleFind} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>First Name *</label>
              <input className={inputClass} placeholder="Sarah" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Last Name *</label>
              <input className={inputClass} placeholder="Jenkins" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className={labelClass}>Company Domain *</label>
            <input className={inputClass} placeholder="cloudscale.io" value={domain} onChange={(e) => setDomain(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-lg transition-all disabled:opacity-50">
            {loading ? "Finding Email..." : "Find & Verify Email"}
          </button>
        </form>

        {/* Verification Result */}
        {result && (
          <div className="p-4 rounded-xl bg-secondary/60 border border-border space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Found Verified Email:</p>
                <p className="font-mono text-lg font-bold text-foreground">{result.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.confidenceScore >= 80 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"}`}>
                {result.confidenceScore}% Confidence Score
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-2.5 rounded bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Syntax Regex:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Valid</span>
              </div>
              <div className="p-2.5 rounded bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">MX Resolution:</span>
                <span className={`font-semibold flex items-center gap-1 ${result.mxFound ? "text-emerald-400" : "text-red-400"}`}>
                  {result.mxFound ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />} {result.mxFound ? "MX Found" : "No MX"}
                </span>
              </div>
              <div className="p-2.5 rounded bg-background border border-border">
                <span className="text-muted-foreground block text-[10px]">Catch-All Status:</span>
                <span className="font-semibold text-foreground">{result.isCatchAll ? "Catch-All Domain" : "Safe Inbox"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSV Bulk Email Verifier */}
      <div className="glass rounded-xl p-6 border border-border space-y-3 max-w-2xl">
        <h2 className="font-semibold text-foreground text-base flex items-center gap-2">
          <Upload className="w-5 h-5 text-emerald-400" /> CSV Bulk Email Finder & Verifier
        </h2>
        <p className="text-xs text-muted-foreground">Upload a CSV with <code className="text-primary">First Name</code>, <code className="text-primary">Last Name</code>, and <code className="text-primary">Domain</code> columns to find and verify email addresses in bulk.</p>
        <button className="bg-secondary hover:bg-accent border border-border text-foreground text-sm font-semibold px-4 py-2 rounded-lg transition-all">
          Upload CSV for Bulk Verification
        </button>
      </div>
    </div>
  );
}
